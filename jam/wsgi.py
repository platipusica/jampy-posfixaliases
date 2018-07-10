import sys
import os
import json
import uuid
import traceback
import datetime, time
from threading import Lock
from types import MethodType
import mimetypes
import jam
import base64

sys.path.insert(1, os.path.join(os.path.dirname(jam.__file__), 'third_party'))

from werkzeug.wrappers import Request, Response
from werkzeug.routing import Map, Rule
from werkzeug.exceptions import HTTPException, NotFound
from werkzeug.wsgi import SharedDataMiddleware, peek_path_info, get_path_info
from werkzeug.local import Local, LocalManager
from werkzeug.http import parse_date, http_date
from werkzeug.contrib.securecookie import SecureCookie
from werkzeug.utils import cached_property
from werkzeug._compat import to_unicode, to_bytes

import jam.common as common
from jam.common import error_message
import jam.adm_server as adm_server
from jam.items import AbortException

class JamSecureCookie(SecureCookie):
    serialization_method = json

    @classmethod
    def quote(cls, value):
        if cls.serialization_method is not None:
            value = cls.serialization_method.dumps(value)
            ### Added line
            value = to_bytes(value, 'utf-8')
        if cls.quote_base64:
            value = b''.join(base64.b64encode(value).splitlines()).strip()
        return value

    @classmethod
    def unquote(cls, value):
        if cls.quote_base64:
            value = base64.b64decode(value)
        ### Added line
        value = to_unicode(value, 'utf-8')
        if cls.serialization_method is not None:
            value = cls.serialization_method.loads(value)
        return value

class JamRequest(Request):

    def session_key(self, task):
        if task.app.admin == task:
            return '%s_session_%s' % (task.item_name, self.environ['SERVER_PORT'])
        else:
            return '%s_session' % (task.item_name)

    def get_session(self, task):
        if not hasattr(self, '_cookie') and task:
            secret_key = to_bytes('', 'utf-8')
            key = self.session_key(task)
            self._cookie = JamSecureCookie.load_cookie(self, key=key, secret_key=secret_key)
            expires = self._cookie.get('session_expires')
            if expires and time.time() > expires:
                self._cookie = {}
        return self._cookie

    def save_session(self, response, app, task):
        if task:
            session_expires = None
            if app.admin.safe_mode and app.admin.timeout:
                session_expires = time.time() + app.admin.timeout
            key = self.session_key(task)
            session = self.get_session(task)
            session['session_expires'] = session_expires
            session.save_cookie(response, key=key, session_expires=session_expires)

def create_application(from_file=None):
    if from_file:
        work_dir = os.path.dirname(os.path.abspath(from_file))
    else:
        work_dir = os.getcwd()
    os.chdir(work_dir)
    static_files = {
        '/static':  os.path.join(work_dir, 'static')
    }

    jam.context = Local()
    local_manager = LocalManager([jam.context])

    application = App(work_dir)
    application = SharedDataMiddleware(application, static_files)
    application = local_manager.make_middleware(application)
    return application

class App():
    def __init__(self, work_dir):
        mimetypes.add_type('text/cache-manifest', '.appcache')
        self.started = datetime.datetime.now()
        self.work_dir = work_dir
        self._loading = False
        self._load_lock = Lock()
        self._updating_task = False
        self.admin = None
        self.task = None
        self.privileges = None
        self._busy = 0
        self.pid = os.getpid()
        self.task_server_modified = False
        self.task_client_modified = True
        self.under_maintenance = False
        self.jam_dir = os.path.dirname(jam.__file__)
        self.jam_version = jam.version()
        self.__task_locked = False
        self.application_files = {
            '/': self.work_dir,
            '/jam/': self.jam_dir
        }
        self.fileserver = SharedDataMiddleware(None, self.application_files, cache_timeout=1)
        self.url_map = Map([
            Rule('/', endpoint='root_file'),
            Rule('/<file_name>', endpoint='root_file'),
            Rule('/js/<file_name>', endpoint='file'),
            Rule('/css/<file_name>', endpoint='file'),
            Rule('/jam/js/<file_name>', endpoint='file'),
            Rule('/jam/js/ace/<file_name>', endpoint='file'),
            Rule('/jam/css/<file_name>', endpoint='file'),
            Rule('/jam/css/themes/<file_name>', endpoint='file'),
            Rule('/jam/img/<file_name>', endpoint='file'),
            Rule('/api', endpoint='api'),
            Rule('/upload', endpoint='upload')
        ])
        self.admin = self.create_admin()

    def create_admin(self):
        return adm_server.create_admin(self)

    def get_task(self):
        if self.task:
            return self.task
        else:
            if not self._loading:
                self._loading = True
                try:
                    with self._load_lock:
                        self.task = self.admin.create_task()
                except:
                    traceback.print_exc()
                    raise
                finally:
                    self._loading = False
            if self.task:
                self.__task_locked = True
            return self.task

    def task_locked(self):
        return self.__task_locked

    def __call__(self, environ, start_response):
        jam.context.environ = environ
        request = JamRequest(environ)
        adapter = self.url_map.bind_to_environ(request.environ)
        try:
            endpoint, values = adapter.match()
            if endpoint in ['file', 'root_file']:
                result = self.serve_file(environ, start_response, endpoint, **values)
                return result
            elif endpoint in ['api', 'upload']:
                response = getattr(self, 'on_' + endpoint)(request, **values)
        except HTTPException as e:
            if peek_path_info(environ) == 'ext':
                response = self.on_ext(request)
            else:
                response = e
        jam.context.session = None
        return response(environ, start_response)

    def check_modified(self, file_path, environ):
        if environ.get('HTTP_IF_MODIFIED_SINCE'):
            date1 = parse_date(environ['HTTP_IF_MODIFIED_SINCE'])
            date2 = datetime.datetime.utcfromtimestamp(os.path.getmtime(file_path)).replace(microsecond=0)
            if date1 != date2:
                try:
                    os.utime(file_path, None)
                except:
                    pass

    def serve_file(self, environ, start_response, endpoint, file_name=None):
        if endpoint == 'root_file':
            if not file_name:
                file_name = 'index.html'
                environ['PATH_INFO'] = environ['PATH_INFO'] + '/index.html'
            elif file_name == 'admin.html':
                file_name = 'builder.html'
            if file_name == 'index.html':
                self.check_modified(file_name, environ)
                if self.get_task():
                    self.check_project_modified()
                else:
                    return Response(self.admin.language('no_task'))(environ, start_response)
            elif file_name == 'builder.html':
                self.check_modified(os.path.join(to_unicode(self.jam_dir, 'utf-8'), file_name), environ)
                environ['PATH_INFO'] = os.path.join('jam', file_name)
        if file_name:
            base, ext = os.path.splitext(file_name)
        init_path_info = None
        if common.SETTINGS['COMPRESSED_JS'] and ext and ext in ['.js', '.css']:
            init_path_info = environ['PATH_INFO']
            min_file_name = base + '.min' + ext
            environ['PATH_INFO'] = environ['PATH_INFO'].replace(file_name, min_file_name)
        try:
            try:
                return self.fileserver(environ, start_response)
            except Exception as e:
                if init_path_info:
                    environ['PATH_INFO'] = init_path_info
                    return self.fileserver(environ, start_response)
                else:
                    raise
        except Exception as e:
            return Response('')(environ, start_response)

    def create_post_response(self, request, result):
        response = Response()
        accepts_gzip = 0
        try:
            if request.environ.get("HTTP_ACCEPT_ENCODING").find("gzip") != -1:
                accepts_gzip = 1
        except:
            pass
        try:
            buff = json.dumps(result, default=common.json_defaul_handler)
        except:
            print('wsgi.py create_post_response error:')
            print(result)
            raise
        response.headers['Content-Type'] = 'application/json'
        if accepts_gzip:
            buff = common.compressBuf(buff)
            response.headers['Content-encoding'] = 'gzip'
            response.headers['Content-Length'] = str(len(buff))
        response.set_data(buff)
        return response

    def get_client_address(self, request):
        try:
            return request.environ['HTTP_X_FORWARDED_FOR'].split(',')[-1].strip()
        except KeyError:
            return request.environ['REMOTE_ADDR']

    def create_session(self, request, task, user_info=None):
        if not user_info:
            user_info = {
                'user_id': None,
                'role_id': None,
                'role_name': '',
                'user_name': '',
                'admin': False
            }
        cookie = request.get_session(task)
        session = {}
        session['ip'] = self.get_client_address(request);
        session['uuid'] = str(uuid.uuid4())
        session['user_info'] = user_info
        cookie['info'] = session
        cookie.modified = True
        return cookie

    def connect(self, request, task):
        if self.check_session(request, task):
            return True

    def valid_session(self, task, session, request):
        if self.admin.safe_mode:
            user_info = session['user_info']
            if not (user_info and user_info.get('user_id')):
                return False
            if not self.admin.ignore_change_ip and task != self.admin and not task.on_login:
                try:
                    ip = self.get_client_address(request);
                    if not adm_server.user_valid_ip(self.admin, user_info['user_id'], ip):
                        return False
                except:
                    return False
        return True

    def check_session(self, request, task):
        c = request.get_session(task)
        if not c.get('info') and not self.admin.safe_mode:
            c = self.create_session(request, task)
        session = c.get('info')
        if session:
            if not self.valid_session(task, session, request):
                self.logout(request, task)
                return False
            jam.context.session = session
            return True

    def login(self, request, task, login, password):
        ip = None
        if not self.admin.ignore_change_ip:
            ip = self.get_client_address(request);
        if self.admin == task or task.on_login is None:
            user_info = adm_server.login(self.admin, login, password, self.admin == task, ip)
        elif task.on_login:
            try:
                user_info = task.on_login(task, login, password)
            except:
                user_info = None
                traceback.print_exc()
        if user_info:
            self.create_session(request, task, user_info)
            return True

    def logout(self, request, task):
        cookie = cookie = request.get_session(task)
        cookie['info'] = None
        jam.context.session = None

    def check_project_modified(self):
        if self.task_server_modified or self.task_client_modified:
            if not self._updating_task:
                self._updating_task = True
                self.__task_locked = False
                try:
                    if self.task_server_modified:
                        self.admin.reload_task()
                        self.task_server_modified = False
                    if self.task_client_modified:
                        self.admin.update_events_code()
                        self.task_client_modified = False
                finally:
                    self._updating_task = False
                    self.__task_locked = True

    def import_metadata(self, task, task_id, file_name, from_client):
        if self.get_task():
            self.__task_locked = False
            try:
                return adm_server.import_metadata(task, task_id, file_name, from_client)
            finally:
                self.__task_locked = True

    def get_privileges(self, role_id):
        if self.privileges is None:
            roles, privileges = adm_server.get_roles(self.admin)
            self.privileges = privileges
        try:
            result = self.privileges[role_id]
        except:
            result = {}
        return result

    def init_client(self, task):
        session = jam.context.session
        priv = None
        user_info = {}
        if session:
            user_info = session['user_info']
            role_id = user_info.get('role_id')
            if role_id:
                priv = self.get_privileges(role_id)
        result = {
            'task': task.get_info(),
            'settings': self.admin.get_settings(),
            'locale': self.admin.locale,
            'language': self.admin.lang,
            'user_info': user_info,
            'privileges': priv
        }
        return result, ''

    def on_api(self, request):
        error = ''
        if request.method == 'POST':
            r = {'result': None, 'error': None}
            try:
                data = request.get_data()
                if type(data) != str:
                    data = to_unicode(data, 'utf-8')
                method, task_id, item_id, params, date = json.loads(data)
                if task_id == 0:
                    task = self.admin
                else:
                    task = self.get_task()
                result = {'status': common.RESPONSE, 'data': None, 'version': task.version}
                if not task:
                    result['status'] = common.NO_PROJECT
                elif self.under_maintenance:
                    result['status'] = common.UNDER_MAINTAINANCE
                elif method == 'connect':
                    self.connect(request, task)
                    result['data'] = self.connect(request, task)
                elif method == 'login':
                    result['data'] = self.login(request, task, params[0], params[1])
                elif method == 'logout':
                    self.logout(request, task);
                    result['status'] = common.NOT_LOGGED
                    result['data'] = common.NOT_LOGGED
                else:
                    if not self.check_session(request, task):
                        result['status'] = common.NOT_LOGGED
                        result['data'] = common.NOT_LOGGED
                    else:
                        item = task
                        if task and item_id:
                            item = task.item_by_ID(item_id)
                        self._busy += 1
                        try:
                            data = None
                            started = datetime.datetime.now()
                            if task.on_before_request:
                                data = task.on_before_request(item, method, params)
                            if not data:
                                data = self.get_response(item, method, params)
                            if task.on_after_request:
                                task.on_after_request(item, method, params, datetime.datetime.now() - started)
                        finally:
                            self._busy -= 1
                        result['data'] = data
                r ['result'] = result
            except AbortException as e:
                traceback.print_exc()
                error = error_message(e)
                r['result'] = {'data': [None, error]}
                r['error'] = error
            except Exception as e:
                traceback.print_exc()
                error = error_message(e)
                if common.SETTINGS['DEBUGGING'] and task_id != 0:
                    raise
                r['result'] = {'data': [None, error]}
                r['error'] = error
            response = self.create_post_response(request, r)
            request.save_session(response, self, task)
            return response

    def get_response(self, item, method, params):
        if method == 'open':
            return item.select_records(params, safe=True)
        elif method == 'apply':
            return item.apply_changes(params, safe=True)
        elif method == 'server':
            return self.server_func(item, params[0], params[1])
        elif method == 'total_records':
            return item.get_record_count(params, safe=True)
        elif method == 'print':
            return item.print_report(*params, safe=True), ''
        elif method == 'load':
            return self.init_client(item)

    def server_func(self, obj, func_name, params):
        result = None
        error = ''
        func = getattr(obj, func_name)
        if func:
            result = func(obj, *params)
        else:
            raise Exception('item: %s no server function with name %s' % (obj.item_name, func_name))
        return result, error

    def on_ext(self, request):
        if request.method == 'POST':
            r = {'result': None, 'error': None}
            method = get_path_info(request.environ)
            data = request.get_data()
            if type(data) != str:
                data = to_unicode(data, 'utf-8')
            params = json.loads(data)
            task = self.get_task()
            try:
                data = None
                if self.under_maintenance:
                    status = common.UNDER_MAINTAINANCE
                elif task.on_ext_request:
                    status = common.RESPONSE
                    self._busy += 1
                    try:
                        data = task.on_ext_request(task, method, params)
                    finally:
                        self._busy -= 1
                else:
                    status = None
                r['result'] = {'status': status, 'data': data, 'version': task.version}
            except AbortException as e:
                traceback.print_exc()
                r['result'] = {'data': [None, error_message(e)]}
                r['error'] = error_message(e)
            except Exception as e:
                traceback.print_exc()
                #~ if common.SETTINGS['DEBUGGING']:
                    #~ raise
                r['result'] = {'data': [None, error_message(e)]}
                r['error'] = error_message(e)
            return self.create_post_response(request, r)

    def on_upload(self, request):

        def find_param(data):
            pos = data.find(to_bytes(';', 'utf-8'))
            return data[:pos], pos + 1

        def read_user_info(data):
            info_len, pos = find_param(data)
            info_len = int(info_len)
            user_info = data[pos:pos+info_len]
            task_ID, p = find_param(user_info)
            task_name = user_info[p:]
            pos = pos + info_len + 1
            return task_name, int(task_ID), pos

        if request.method == 'POST':
            try:
                data = request.get_data()
                header = []
                header_str = to_bytes('', 'utf-8')
                length = 0
                string = to_bytes('', 'utf-8')
                task_name, task_id, pos = read_user_info(data)
                if task_id == 0:
                    task = self.admin
                else:
                    task = self.get_task()
                if self.admin.safe_mode:
                    if not request.get_session(task).get('info'):
                        return Response()
                for i in range(len(data)):
                    s = data[pos + i:pos+i+1]
                    header_str += s
                    if s == to_bytes(';', 'utf-8'):
                        if len(header) == 0:
                            length = int(string)
                        header.append(int(string))
                        if len(header) == 2 * (length + 1):
                            break;
                        string = to_bytes('', 'utf-8')
                    else:
                        string += s
                start = len(header_str) + pos
                path = os.path.join(to_unicode(os.getcwd(), 'utf-8'), \
                    os.path.normpath(to_unicode(data[start: start + header[1]], 'utf-8')))
                if not os.path.exists(path):
                    os.makedirs(path)
                start = start + header[1]
                for i in range(length):
                    index = 2 * i + 2
                    file_name = to_unicode(data[start: start + header[index]], 'utf-8')
                    start = start + header[index]
                    index += 1
                    content = data[start: start + header[index]]
                    file_name = os.path.join(path, file_name)
                    with open(file_name, 'wb') as f:
                        f.write(content)
                    os.chmod(file_name, 0o666)
                    start = start + header[index]
            except:
                traceback.print_exc()
            return Response()

    def get_client_ip(self, environ):
        x_forwarded_for = environ.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[-1].strip()
        else:
            ip = environ.get('REMOTE_ADDR')
        return ip

    def stop(self, sigvalue):
        self.kill()

    def kill(self):
        import signal, subprocess
        if os.name == "nt":
            subprocess.Popen("taskkill /F /T /pid %i" % self.pid, shell=True)
        else :
            os.killpg(self.pid, signal.SIGKILL)
