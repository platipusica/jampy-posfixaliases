
(function($) {
    "use strict";

    var settings,
        locale,
        language,
        consts = {
            "RESPONSE": 1,
            "NOT_LOGGED": 2,
            "UNDER_MAINTAINANCE": 3,
            "NO_PROJECT": 4,

            "TEXT": 1,
            "INTEGER": 2,
            "FLOAT": 3,
            "CURRENCY": 4,
            "DATE": 5,
            "DATETIME": 6,
            "BOOLEAN": 7,
            "LONGTEXT": 8,
            "KEYS": 9,

            "ITEM_FIELD": 1,
            "FILTER_FIELD": 2,
            "PARAM_FIELD": 3,

            "FILTER_EQ": 1,
            "FILTER_NE": 2,
            "FILTER_LT": 3,
            "FILTER_LE": 4,
            "FILTER_GT": 5,
            "FILTER_GE": 6,
            "FILTER_IN": 7,
            "FILTER_NOT_IN": 8,
            "FILTER_RANGE": 9,
            "FILTER_ISNULL": 10,
            "FILTER_EXACT": 11,
            "FILTER_CONTAINS": 12,
            "FILTER_STARTWITH": 13,
            "FILTER_ENDWITH": 14,
            "FILTER_CONTAINS_ALL": 15,

            "ALIGN_LEFT": 1,
            "ALIGN_CENTER": 2,
            "ALIGN_RIGHT": 3,

            "STATE_INACTIVE": 0,
            "STATE_BROWSE": 1,
            "STATE_INSERT": 2,
            "STATE_EDIT": 3,
            "STATE_DELETE": 4,

            "RECORD_UNCHANGED": null,
            "RECORD_INSERTED": 1,
            "RECORD_MODIFIED": 2,
            "RECORD_DELETED": 3,
            "RECORD_DETAILS_MODIFIED": 4,

            "REC_STATUS": 0,
            "REC_CONTROLS_INFO": 1,
            "REC_CHANGE_ID": 2,

            "UPDATE_OPEN": 0,
            "UPDATE_DELETE": 1,
            "UPDATE_CANCEL": 2,
            "UPDATE_APPEND": 3,
            "UPDATE_INSERT": 4,
            "UPDATE_SCROLLED": 5,
            "UPDATE_CONTROLS": 6,
            "UPDATE_CLOSE": 7,
            "UPDATE_STATE": 8,
            "UPDATE_APPLIED": 9,
            "UPDATE_PAGE_CHANGED": 10,
            "UPDATE_SUMMARY": 11
        },
        align_value = ['', 'left', 'center', 'right'],
        filter_value = ['eq', 'ne', 'lt', 'le', 'gt', 'ge', 'in', 'not_in',
            'range', 'isnull', 'exact', 'contains', 'startwith', 'endwith',
            'contains_all'
        ],
        field_attr = [
            "ID",
            "field_name",
            "field_caption",
            "data_type",
            "required",
            "lookup_item",
            "master_field",
            "lookup_field",
            "lookup_field1",
            "lookup_field2",
            "view_visible",
            "view_index",
            "edit_visible",
            "edit_index",
            "_read_only",
            "_expand",
            "_word_wrap",
            "field_size",
            "default_value",
            "is_default",
            "calculated",
            "editable",
            "_alignment",
            "lookup_values",
            "multi_select",
            "multi_select_all",
            "enable_typeahead",
            "field_help",
            "field_placeholder",
            "field_mask"
        ],
        filter_attr = [
            "filter_name",
            "filter_caption",
            "field_name",
            "filter_type",
            "multi_select_all",
            "data_type",
            "visible",
            "filter_help",
            "filter_placeholder"
        ],
        field_type_names = ["", "text", "integer", "float", 'currency',
            "date", "datetime", "boolean", "longtext", "keys"
        ];



    /**********************************************************************/
    /*                        AbsrtactItem class                          */
    /**********************************************************************/

    function AbsrtactItem(owner, ID, item_name, caption, visible, type, js_filename) {
        if (visible === undefined) {
            visible = true;
        }
        this.owner = owner;
        this.item_name = item_name || '';
        this.item_caption = caption || '';
        this.visible = visible;
        this.ID = ID || null;
        this.item_type_id = type;
        this.item_type = '';
        if (type) {
            this.item_type = this.types[type - 1];
        }
        if (js_filename) {
            this.js_filename = 'js/' + js_filename;
        }
        this.items = [];
        if (owner) {
            if (!owner.find(item_name)) {
                owner.items.push(this);
            }
            if (!(item_name in owner)) {
                owner[item_name] = this;
            }
            this.task = owner.task;
        }
    }

    AbsrtactItem.prototype = {
        constructor: AbsrtactItem,

        types: ["root", "users", "roles", "tasks", 'task',
            "items", "items", "details", "reports",
            "item", "item", "detail_item", "report", "detail"
        ],

        get_master_field: function(fields, master_field) {
            var i = 0,
                len = fields.length;
            for (; i < len; i++) {
                if (fields[i].ID == master_field) {
                    return fields[i];
                }
            }
        },

        each_item: function(callback) {
            var i = 0,
                len = this.items.length,
                value;
            for (; i < len; i++) {
                value = callback.call(this.items[i], this.items[i], i);
                if (value === false) {
                    break;
                }
            }
        },

        all: function(func) {
            var i = 0,
                len = this.items.length;
            func.call(this, this);
            for (; i < len; i++) {
                this.items[i].all(func);
            }
        },

        find: function(item_name) {
            var i = 0,
                len = this.items.length;
            for (; i < len; i++) {
                if (this.items[i].item_name === item_name) {
                    return this.items[i];
                }
            }
        },

        item_by_ID: function(id_value) {
            var result;
            if (this.ID === id_value) {
                return this;
            }
            var i = 0,
                len = this.items.length;
            for (; i < len; i++) {
                result = this.items[i].item_by_ID(id_value);
                if (result) {
                    return result;
                }
            }
        },

        addChild: function(ID, item_name, caption, visible, type, js_filename) {
            var NewClass;
            if (this.getChildClass) {
                NewClass = this.getChildClass();
                if (NewClass) {
                    return new NewClass(this, ID, item_name, caption, visible, type, js_filename);
                }
            }
        },

        send_request: function(request, params, callback) {
            return this.task.process_request(request, this, params, callback);
        },

        init: function(info) {
            var i = 0,
                items = info.items,
                child,
                len = items.length,
                item_info;
            for (; i < len; i++) {
                item_info = items[i][1];
                child = this.addChild(item_info.id, item_info.name,
                    item_info.caption, item_info.visible, item_info.type, item_info.js_filename);
                child._default_order = item_info.default_order;
                child._primary_key = item_info.primary_key;
                child._deleted_flag = item_info.deleted_flag;
                child._master_id = item_info.master_id;
                child._master_rec_id = item_info.master_rec_id;
                child._keep_history = item_info.keep_history;
                child._lock_on_edit = item_info.lock_on_edit;
                child._view_params = item_info.view_params;
                child._edit_params = item_info.edit_params;
                child.virtual_table = item_info.virtual_table;

                child.prototype_ID = item_info.prototype_ID
                if (child.initAttr) {
                    child.initAttr(item_info);
                }
                child.init(item_info);
            }
        },

        bind_items: function() {
            var i = 0,
                len = this.items.length;
            if (this._bind_item) {
                this._bind_item();
            }
            for (; i < len; i++) {
                this.items[i].bind_items();
            }
        },

        script_loaded: function() {
            if (this.js_filename) {
                return this.task._script_cache[this.js_filename];
            } else {
                return true;
            }
        },

        _check_args: function(args) {
            var i,
                result = {};
            for (i = 0; i < args.length; i++) {
                result[typeof args[i]] = args[i];
            }
            return result;
        },

        load_script: function(js_filename, callback, onload) {
            var self = this,
                url,
                s0,
                s;
            if (js_filename && !this.task._script_cache[js_filename]) {
                s = document.createElement('script');
                s0 = document.getElementsByTagName('script')[0];
                url = js_filename;

                s.src = url;
                s.type = "text/javascript";
                s.async = true;
                s0.parentNode.insertBefore(s, s0);
                s.onload = function() {
                    self.task._script_cache[js_filename] = true;
                    if (onload) {
                        onload.call(self, self);
                    }
                    if (callback) {
                        callback.call(self, self);
                    }
                };
            } else {
                if (callback) {
                    callback.call(self, self);
                }
            }
        },

        load_module: function(callback) {
            this.load_modules([this], callback);
        },

        load_modules: function(item_list, callback) {
            var self = this,
                i = 0,
                len = item_list.length,
                item,
                list = [],
                mutex = 0,
                calcback_executing = false,
                load_script = function(item) {
                    item.load_script(
                        item.js_filename,
                        function() {
                            if (--mutex === 0) {
                                if (callback && !calcback_executing) {
                                    calcback_executing = true;
                                    callback.call(self, self);
                                }
                            }
                        },
                        function() {
                            item.bind_handlers();
                        }
                    );
                };
            for (; i < len; i++) {
                item = item_list[i];
                if (!item.script_loaded()) {
                    list.push(item);
                }
                if (item.details && item.each_detail) {
                    item.each_detail(function(d) {
                        if (!d.script_loaded()) {
                            list.push(d);
                        }
                    });
                }
            }
            len = list.length;
            mutex = len;
            if (len) {
                for (i = 0; i < len; i++) {
                    load_script.call(list[i], list[i]);
                }
            } else {
                if (callback) {
                    callback.call(this, this);
                }
            }
        },

        bind_handlers: function() {
            var events = task.events['events' + this.ID];

            this._events = [];
            for (var event in events) {
                if (events.hasOwnProperty(event)) {
                    this[event] = events[event];
                    this._events.push([event, events[event]]);
                }
            }
        },

        bind_events: function() {
            var i = 0,
                len = this.items.length;

            this.bind_handlers();

            for (; i < len; i++) {
                this.items[i].bind_events();
            }
        },

        view$: function(selector) {
            return this.view_form.find(selector);
        },

        edit$: function(selector) {
            return this.edit_form.find(selector);
        },

        filter$: function(selector) {
            return this.filter_form.find(selector);
        },

        param$: function(selector) {
            return this.param_form.find(selector);
        },

        can_view: function() {
            return this.task.has_privilege(this, 'can_view');
        },

        _search_template: function(name, suffix) {
            var template,
                search = "." + name;
            if (suffix) {
                search = "." + name + "-" + suffix
            }
            template = this.task.templates.find(search);
            if (template.length) {
                return template;
            }
        },

        _parse_template: function(template) {
            var index,
                keyword = '$include(',
                include,
                inc_template,
                html = template.html(),
                h = '';
            template.empty();
            html = html.replace(/<!--(.*?)-->/g, "");
            while (true) {
                index = html.indexOf(keyword);
                if (index !== -1) {
                    h += html.slice(0, index);
                    html = html.slice(index + keyword.length);
                    index = html.indexOf(')');
                    include = html.slice(0, index + 1)
                        .replace(/[('")]/g, '')
                    inc_template = this.task.templates.find(include).clone();
                    inc_template = this._parse_template(inc_template);
                    h += inc_template.html();
                    html = html.slice(index + 1);
                }
                else {
                    h += html;
                    break;
                }
            }
            return template.append($(h));
        },

        find_template: function(suffix, options) {
            var result,
                template,
                name,
                item = this;
            if (options.template_class) {
                template = this._search_template(options.template_class);
            }
            if (!template) {
                if (item.item_type === "detail") {
                    template = this._search_template(item.owner.item_name + "-" + item.item_name, suffix);
                    if (!template) {
                        template = this._search_template(item.owner.owner.item_name + "-details", suffix);
                    }
                    //~ if (!template) {
                        //~ template = this._search_template("default-details", suffix);
                    //~ }
                    if (!template) {
                        template = this._search_template("default", suffix);
                    }
                    if (!template) {
                        item = item.owner;
                    }
                }
                if (!template) {
                    while (true) {
                        name = item.item_name;
                        template = this._search_template(item.item_name, suffix);
                        if (template) {
                            break;
                        }
                        item = item.owner;
                        if (item === item.task) {
                            break;
                        }
                    }
                }
            }
            if (!template) {
                template = this._search_template('default', suffix);
            }
            if (template) {
//                result = this._parse_template(template.clone());
                result = template.clone();
            }
            else {
                this.warning(this.item_caption + ': ' +  suffix + ' form template not found.')
            }
            return result;
        },

        server: function(func_name, params) {
            var args = this._check_args(arguments),
                callback = args['function'],
                async = args['boolean'],
                res,
                err,
                result;
            if (params !== undefined && (params === callback || params === async)) {
                params = undefined;
            }
            if (params === undefined) {
                params = [];
            } else if (!$.isArray(params)) {
                params = [params];
            }
            if (callback || async) {
                this.send_request('server', [func_name, params], function(result) {
                    res = result[0];
                    err = result[1];
                    if (callback) {
                        callback.call(this, res, err);
                    }
                    if (err) {
                        throw err;
                    }
                });
            } else {
                result = this.send_request('server', [func_name, params]);
                res = result[0];
                err = result[1];
                if (err) {
                    throw err;
                } else {
                    return res;
                }
            }
        },

        _focus_form: function(form) {
            form.find(':input:enabled:visible').each(function(el) {
                if (this.tabIndex !== -1) {
                    this.focus();
                    return false;
                }
            })
        },

        _create_form_header: function(form, options, form_type, container) {
            var $doc,
                $form,
                $title,
                mouseX,
                mouseY,
                defaultOptions = {
                    title: this.item_caption,
                    close_button: true,
                    print: false
                },
                form_header,
                item_class = '';

            function captureMouseMove(e) {
                var $title = $form.find('.modal-header');
                if (mouseX) {
                    e.preventDefault();
                    $title.css('cursor', 'auto');
                    $form.css('margin-left', parseInt($form.css('margin-left'), 10) + e.screenX - mouseX);
                    $form.css('margin-top', parseInt($form.css('margin-top'), 10) + e.screenY - mouseY);
                    mouseX = e.screenX;
                    mouseY = e.screenY;
                }
            }

            function releaseMouseMove(e) {
                mouseX = undefined;
                mouseY = undefined;
                $doc.off("mousemove.modalform");
                $doc.off("mouseup.modalform");
            }
            if (task.old_forms) {
                form_header = $('<div class="modal-header">');
                form_header.css('display', 'block');
            }
            else {
                if (options.form_header && (!form_header || !form_header.length)) {
                    form_header = $(
                        '<div class="modal-header">' +
                            '<div class="header-title"></div>' +
                            '<div class="header-refresh-btn"></div>' +
                            '<div class="header-history-btn"></div>' +
                            '<div class="header-filters"></div>' +
                            '<div class="header-search"></div>' +
                            '<div class="header-print-btn"></div>' +
                            '<div class="header-close-btn"></div>' +
                        '</div>'
                    );
                    form_header.find('.header-search').show();
                }
            }
            if (form_type) {
                if (this.master) {
                    item_class = this.master.item_name + '-' + this.item_name + ' ' + form_type + '-form';
                }
                else {
                    item_class = this.item_name + ' ' + form_type + '-form';
                }
            }
            options = $.extend({}, defaultOptions, options);
            if (!options.title) {
                options.title = '&nbsp';
            }

            if (container && container.length) {
                if (task.old_forms) {
                    form.addClass('jam-form')
                    return form
                }
                else {
                    $form = $(
                        '<div class="form-frame ' + item_class + '" tabindex="-1">' +
                        '</div>'
                    );
                    if (options.form_header) {
                        $form.append(form_header);
                    }
                    if (!options.form_border) {
                        $form.addClass('no-border');
                    }
                }
            }
            else {
                $form = $(
                    '<div class="modal hide normal-modal-border ' + item_class + '" tabindex="-1" data-backdrop="static">' +
                    '</div>'
                );
                if (options.form_header) {
                    $form.append(form_header);
                }
                $doc = $(document);
                $form.on("mousedown", ".modal-header", function(e) {
                    mouseX = e.screenX;
                    mouseY = e.screenY;
                    $doc.on("mousemove.modalform", captureMouseMove);
                    $doc.on("mouseup.modalform", releaseMouseMove);
                });

                $form.on("mousemove", ".modal-header", function(e) {
                    $(this).css('cursor', 'move');
                });
            }
            this._set_form_options($form, options);
            $form.append(form);
            $form.addClass('jam-form');
            return $form;
        },

        _set_old_form_options: function(form, options, form_type) {
            var self = this,
                form_name = form_type + '_form',
                body,
                header = form.find('.modal-header'),
                title = header.find('.modal-title'),
                closeCaption = '',
                close_button = '',
                printCaption = '',
                print_button = '',
                history_button = '';
            if (options.close_button) {
                if (language && options.close_on_escape) {
                    closeCaption = '&nbsp;' + language.close + ' - [Esc]</small>';
                }
                close_button = '<button type="button" id="close-btn" class="close" tabindex="-1" aria-hidden="true" style="padding: 0px 10px;">' +
                    closeCaption + ' ×</button>';
            }
            if (language && options.print) {
                printCaption = '&nbsp;' + language.print + ' - [Ctrl-P]</small>',
                    print_button = '<button type="button" id="print-btn" class="close" tabindex="-1" aria-hidden="true" style="padding: 0px 10px;">' +
                    printCaption + '</button>';
            }
            if (options.history_button && this.keep_history && task.history_item) {
                history_button = '<i id="history-btn" class="icon-film" style="float: right; margin: 5px;"></i>';
            }

            if (!title.text().length) {
                title = ('<h4 class="modal-title">' + options.title + '</h4>');
            } else {
                title.html(options.title);
            }
            header.empty();
            header.append(close_button + history_button + print_button);
            header.append(title);
            header.find("#close-btn").css('cursor', 'default').click(function(e) {
                if (form_name) {
                    self._close_form(form_type);
                }
            });
            header.find('#print-btn').css('cursor', 'default').click(function(e) {
                if (form.find(".form-body").length) {
                    body = form.find(".form-body");
                }
                else if (form.find(".modal-body").length) {
                    body = form.find(".modal-body");
                }
                self.print_html(body);
            });
            header.find('#history-btn').css('cursor', 'default').click(function(e) {
                self.show_history();
            });
        },

        _set_form_options: function(form, options, form_type) {
            var self = this,
                form_name = form_type + '_form',
                header = form.find('.modal-header'),
                close_caption = '',
                close_button = '',
                print_caption = '',
                print_button = '',
                filter_count = 0,
                body;
            if (task.old_forms) {
                this._set_old_form_options(form, options, form_type);
                return;
            }
            if (!options.title) {
                options.title = this.item_caption;
            }
            if (options.close_button) {
                if (language && options.close_on_escape) {
                    close_caption = '&nbsp;' + language.close + ' - [Esc]</small>';
                }
                close_button = '<button type="button" id="close-btn" class="close" tabindex="-1" aria-hidden="true" style="padding: 0px 10px;">' +
                    close_caption + ' ×</button>';
                header.find('.header-close-btn').html(close_button);
            }
            else {
                header.find('.header-close-btn').hide();
            }

            if (language && options.print) {
                print_caption = '&nbsp;' + language.print + ' - [Ctrl-P]</small>',
                    print_button = '<button type="button" id="print-btn" class="close" tabindex="-1" aria-hidden="true" style="padding: 0px 10px;">' +
                    print_caption + '</button>';
                header.find('.header-print-btn').html(print_button);
            }
            else {
                header.find('.header-print-btn').hide();
            }

            if (options.history_button && this.keep_history && task.history_item) {
                header.find('.header-history-btn')
                    .html('<a class="btn header-btn history-btn" href="#"><i class="icon-film"></i></a>')
                    .tooltip({placement: 'bottom', title: language.view_rec_history, trigger: 'hover'});
                header.find('.history-btn').css('cursor', 'default').click(function(e) {
                    e.preventDefault();
                    self.show_history();
                });
            }
            else {
                header.find('.header-history-btn').hide();
            }

            if (!this.virtual_table && options.refresh_button) {
                header.find('.header-refresh-btn')
                    .html('<a class="btn header-btn refresh-btn" href="#"><i class="icon-refresh"></i></a>')
                    .tooltip({placement: 'bottom', title: language.refresh_page, trigger: 'hover'});
                header.find(".refresh-btn").css('cursor', 'default').click(function(e) {
                    e.preventDefault();
                    self.refresh_page(true);
                });
            }
            else {
                header.find('.header-refresh-btn').hide();
            }


            if (this.each_filter) {
                this.each_filter(function(f) {
                    if (f.visible) {
                        filter_count += 1;
                    }
                })
            }
            if (options.enable_filters && filter_count) {
                header.find('.header-filters')
                    .html(
                        '<a class="btn header-btn header-filters-btn" href="#">' +
                        //~ '<i class="icon-filter"></i> ' +
                        language.filters + '</a>' +
                        '<span class="filters-text pull-left"></span>'
                    )

                header.find('.header-filters-btn')
                    .tooltip({placement: 'bottom', title: language.set_filters, trigger: 'hover'})
                    .css('cursor', 'default')
                    .click(function(e) {
                        e.preventDefault();
                        self.create_filter_form();
                    });
            }

            if (!options.enable_search) {
                header.find('.header-search').hide();
            }

            header.find('.header-title').html('<h4 class="modal-title">' + options.title + '</h4>')

            header.find("#close-btn").css('cursor', 'default').click(function(e) {
                if (form_name) {
                    self._close_form(form_type);
                }
            });
            header.find('#print-btn').css('cursor', 'default').click(function(e) {
                if (form.find(".form-body").length) {
                    body = form.find(".form-body");
                }
                else if (form.find(".modal-body").length) {
                    body = form.find(".modal-body");
                }
                self.print_html(body);
            });
        },

        init_filters: function() {
            var self = this;
            this._on_filters_applied_internal = function() {
                if (self.view_form.length) {
                    self.view_form.find(".filters-text").text(self.get_filter_text());
                }
            };
        },

        init_search: function() {

            function can_search_on_field(field) {
                if (field && field.lookup_type !== "boolean" &&
                    field.lookup_type !== "date" &&  field.lookup_type !== "datetime") {
                    return true;
                }
            }

            function isCharCode(code) {
                if (code >= 48 && code <= 57 || code >= 96 && code <= 105 ||
                    code >= 65 && code <= 90 || code >= 186 && code <= 192 ||
                    code >= 219 && code <= 222) {
                    return true;
                }
            }

            var timeOut,
                self = this,
                i,
                search_form,
                search,
                captions = [],
                field,
                search_field;
            if (this.view_options.search_field) {
                search_field = this.view_options.search_field;
            }
            else if (this.view_options.fields.length) {
                for (i = 0; i < this.view_options.fields.length; i++) {
                    field = this.field_by_name(this.view_options.fields[i]);
                    if (field && can_search_on_field(field)) {
                        search_field = this.view_options.fields[i];
                        break;
                    }
                }
            }
            if (search_field) {
                this.view_form.find('#search-form').remove() // for compatibility with previous projects
                this.view_form.find('.header-search').append(
                    '<form id="search-form" class="form-inline pull-right">' +
                        '<label  class="control-label" for="search-input">' +
                            '<span class="label" id="search-fieldname"></span>' +
                        '</label>' +
                        ' <input id="search-input" type="text" class="input-medium search-query" autocomplete="off">' +
                        '<a id="search-field-info" href="#" tabindex="-1">' +
                            ' <span class="badge">?</span>' +
                        '</a>' +
                    '</form>');

                this.view_form.find('.header-search').show();
                // if (this.lookup_field && this.lookup_field.value && !this.lookup_field.multi_select) {
                //     this.view_form.find("#selected-value")
                //         .text(this.lookup_field.display_text)
                //         .click(function() {
                //             this.view_form.find('#search-input').val(this.lookup_field.lookup_text);
                //             this.search(this.default_field.field_name, this.lookup_field.lookup_text);
                //         });
                //     this.view_form.find("#selected-div").css('display', 'inline-block');
                // }
                this.view_form.find('#search-fieldname').text(
                    this.field_by_name(search_field).field_caption);
                this.view_form.find('#search-field-info')
                    .popover({
                        container: 'body',
                        placement: 'left',
                        trigger: 'hover',
                        title: 'Search field selection',
                        content: 'To select a search field hold Ctrl key and click on the corresponding column of the table.'
                    })
                    .click(function(e) {
                        e.preventDefault();
                    });
                search = this.view_form.find("#search-input");
                search.on('input', function() {
                    var input = $(this);
                    input.css('font-weight', 'normal');
                    clearTimeout(timeOut);
                    timeOut = setTimeout(
                        function() {
                            var field = self.field_by_name(search_field),
                                search_type = 'contains_all';
                            self.set_order_by(self.view_options.default_order);
                            self._search_params = self.search(search_field, input.val(), search_type, function() {
                                input.css('font-weight', 'bold');
                            });
                        },
                        500
                    );
                });
                search.keydown(function(e) {
                    var code = e.which;
                    if (code === 13) {
                        e.preventDefault();
                    }
                    else if (code === 40) {
                        self.view_form.find('.dbtable.' + self.item_name + ' .inner-table').focus();
                        e.preventDefault();
                    }
                });
                this.view_form.on('keydown', function(e) {
                    var code = e.which;
                    if (isCharCode(code) || code === 8) {
                        if (!search.is(":focus")) {
                            if (code !== 8) {
                                search.val('');
                            }
                            search.focus();
                        }
                    }
                });
                this.view_form.on('click.search', '.dbtable.' + this.item_name + ' .inner-table td', function(e) {
                    var field;
                    if (e.ctrlKey) {
                        if (search_field !== $(this).data('field_name')) {
                            search_field = $(this).data('field_name');
                            field = self.field_by_name(search_field);
                            if (can_search_on_field(field)) {
                                if (field.field_type === 'date') {

                                }
                                self.view_form.find('#search-fieldname')
                                    .text(self.field_by_name(search_field).field_caption);
                                self.view_form.find("#search-input").val('');
                                self.set_order_by(self.view_options.default_order);
                                self._search_params = self.open(function() {
                                    search.css('font-weight', 'bold');
                                });
                            }
                        }
                    }
                });
            }
            else {
                this.view_form.find("#search-form").hide();
            }
        },

        _active_form: function(form) {
            var cur_form = $(document.activeElement).closest('.jam-form')
            if (form.get(0) === cur_form.get(0)) {
                return true;
            }
        },

        _process_key_event: function(form_type, event_type, e) {
            var i,
                form = this[form_type + '_form'],
                forms;
            if (this._active_form(form)) {
                if (form._form_disabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }
                else {
                    if (e.which !== 116) { //F5
                        e.stopPropagation();
                    }
                    this._process_event(form_type, event_type, e);
                    forms = form.find('.jam-form');
                    forms.each(function() {
                        var form = $(this),
                            options = form.data('options');
                        options.item._process_event(options.form_type, event_type, e);
                    });
                }
            }
        },

        _process_event: function(form_type, event_type, e) {
            var event = 'on_' + form_type + '_form_' + event_type,
                can_close;
            if (event_type === 'close_query') {
                if (this[event]) {
                    can_close = this[event].call(this, this);
                }
                if (!this.master && can_close === undefined && this.owner[event]) {
                    can_close = this.owner[event].call(this, this);
                }
                if (can_close === undefined && this.task[event]) {
                    can_close = this.task[event].call(this, this);
                }
                return can_close;
            }
            else if (event_type === 'keyup' || event_type === 'keydown') {
                if (this[event]) {
                    if (this[event].call(this, this, e)) return;
                }
                if (!this.master && this.owner[event]) {
                    if (this.owner[event].call(this, this, e)) return;
                }
                if (this.task[event]) {
                    if (this.task[event].call(this, this, e)) return;
                }
            }
            else {
                if (this.task[event]) {
                    if (this.task[event].call(this, this)) return;
                }
                if (!this.master && this.owner[event]) {
                    if (this.owner[event].call(this, this)) return;
                }
                if (this[event]) {
                    if (this[event].call(this, this)) return;
                }
            }
        },

        _resize_form: function(form_type, container) {
            var form_name = form_type + '_form',
                form = this[form_name],
                item_options = this[form_type + '_options'],
                container_width;
            container_width = container.innerWidth() -
                parseInt(form.css('border-left-width'), 10) -
                parseInt(form.css('border-right-width'), 10);
            if (item_options.width < container_width) {
                form.width(item_options.width);
            }
            else {
                form.width(container_width);
            }
        },

        _create_form: function(form_type, container) {
            var self = this,
                form,
                form_name = form_type + '_form',
                options = {},
                item_options = this[form_type + '_options'],
                key_suffix,
                resize_timeout,
                width;

            options.item = this;
            options.form_type = form_type;
            options.item_options = item_options;
            options.item_options.form_type = form_type;
            key_suffix = form_name + '.' + this.item_name;
            if (item_options.tab_id) {
                key_suffix += '.' + item_options.tab_id;
            }

            if (container) {
                container.empty();
            }
            form = $("<div></div>").append(this.find_template(form_type, item_options));
            form = this._create_form_header(form, item_options, form_type, container);
            this[form_name] = form
            if (form) {
                options.form = form;
                form.data('options', options);
                form.tabindex = 1;
                if (container) {
                    $(window).on("keyup." + key_suffix, function(e) {
                        if (e.which === 27 && item_options.close_on_escape) {
                            if (self._active_form(self[form_name])) {
                                self._close_form(form_type);
                            }
                        }
                        else {
                            self._process_key_event(form_type, 'keyup', e);
                        }
                    });
                    $(window).on("keydown." + key_suffix, function(e) {
                        self._process_key_event(form_type, 'keydown', e)
                    });
                    container.append(form);
                    this[form_name].bind('destroyed', function() {
                        self._close_modeless_form(form_name);
                    });
                    this._process_event(form_type, 'created');
                    this._set_form_options(form, item_options, form_type);
                    this._focus_form(form);
                    this._process_event(form_type, 'shown');
                    if (item_options.width && form_type !== 'view') {
                        this._resize_form(form_type, container);
                        $(window).on("resize." + key_suffix, function(e) {
                            clearTimeout(resize_timeout);
                            resize_timeout = setTimeout(
                                function() {
                                    self._resize_form(form_type, container);
                                },
                                100
                            );
                        })
                    }
                } else {
                    if (form.hasClass("modal")) {
                        form.on("show", function(e) {
                            if (e.target === self[form_name].get(0)) {
                                e.stopPropagation();
                                self._process_event(form_type, 'created');
                                self._set_form_options(self[form_name], item_options, form_type);
                            }
                        });
                        form.on("shown", function(e) {
                            if (e.target === self[form_name].get(0)) {
                                self._focus_form(self[form_name]);
                                e.stopPropagation();
                                self._process_event(form_type, 'shown');
                            }
                        });
                        form.on("hide", function(e) {
                            if (e.target === self[form_name].get(0)) {
                                var canClose = true;
                                e.stopPropagation();
                                canClose = self._process_event(form_type, 'close_query');
                                if (canClose === false) {
                                    e.preventDefault();
                                    self[form_name].data('_closing', false);
                                }
                            }
                        });
                        form.on("hidden", function(e) {
                            if (e.target === self[form_name].get(0)) {
                                e.stopPropagation();
                                self._process_event(form_type, 'closed');
                                self[form_name].remove();
                                self[form_name] = undefined;
                            }
                        });
                        form.on("keydown." + key_suffix, function(e) {
                            self._process_key_event(form_type, 'keydown', e)
                        });
                        form.on("keyup." + key_suffix, function(e) {
                            self._process_key_event(form_type, 'keyup', e)
                        });

                        form.modal({
                            item: this,
                            form_name: form_name,
                            item_options: item_options
                        });
                    }
                }
            }
        },

        _close_modeless_form: function(form_type) {
            var self = this,
                form_name = form_type + '_form';
            if (this[form_name]) {
                this._close_form(form_type);
            }
            if (this[form_name]) {
                this[form_name].bind('destroyed', function() {
                    self._close_modeless_form(form_type);
                });
                throw this.item_name + " - can't close form";
            }
        },

        _close_form: function(form_type) {
            var self = this,
                form_name = form_type + '_form',
                form = this[form_name],
                options,
                canClose,
                key_suffix;

            if (form) {
                options = form.data('options'),
                key_suffix = form_name + '.' + this.item_name;
                if (options.item_options.tab_id) {
                    key_suffix += '.' + options.item_options.tab_id;
                }
                form.data('_closing', true);
                if (form.hasClass('modal')) {
                    setTimeout(
                        function() {
                            form.modal('hide');
                        },
                        100
                    );
                } else {
                    canClose = self._process_event(options.form_type, 'close_query');
                    if (canClose !== false) {
                        $(window).off("keydown." + key_suffix);
                        $(window).off("keyup." + key_suffix);
                        $(window).off("resize." + key_suffix);
                        this[form_name] = undefined;
                        if (this._tab_info) {
                            this.task.close_tab(this._tab_info.container, this._tab_info.tab_id);
                            this._tab_info = undefined;
                        }
                        self._process_event(options.form_type, 'closed');
                        form.remove();
                    }
                }
            }
        },

        _disable_form: function(form) {
            if (form) {
                form.css('pointer-events', 'none');
                form._form_disabled = true;
            }
        },

        _enable_form: function(form) {
            if (form) {
                form.css('pointer-events', 'auto');
                form._form_disabled = false;
            }
        },

        print_html: function(html) {
            var win = window.frames["dummy"],
                css = $("link[rel='stylesheet']"),
                body,
                head = '<head>';
            css.each(function(i, e) {
                head += '<link href="' + e.href + '" rel="stylesheet">';
            });
            head += '</head>';
            body = html.clone();
            win.document.write(head + '<body onload="window.print()">' + body.html() + '</body>');
            win.document.close();
        },

        alert: function(message, options) {
            var default_options = {
                    type: 'info',
                    header: undefined,
                    align: 'right',
                    replace: true,
                    pulsate: true,
                    click_close: true,
                    body_click_hide: true,
                    show_header: true,
                    timeout: 0
                },
                pos = 0,
                width = 0,
                container = $('body'),
                $alert;
            options = $.extend({}, default_options, options);
            if (!options.replace && $('body').find('.alert-absolute').length) {
                return;
            }
            if (!options.header) {
                options.header = task.language[options.type];
            }
            if (!options.header) {
                options.show_header = false;
            }
            $alert = $(
            '<div class="alert alert-block alert-absolute">' +
              '<button type="button" class="close" data-dismiss="alert">&times;</button>' +
              '<h4>' + options.header + '</h4>' +
              '<p>' + message + '</p>' +
            '</div>'
            );
            if (task.forms_container && task.forms_container.length) {
                container = task.forms_container;
            }
            else {
                $('body').children().each(function() {
                    var $this = $(this);
                    if ($this.width() > width && $this.css('z-index') === 'auto') {
                        width = $this.width();
                        container = $this;
                    }
                });
            }
            $('body').find('.alert-absolute').remove();
            $('body')
                .off('mouseup.alert-absolute keyup.alert-absolute')
                .on('mouseup.alert-absolute keyup.alert-absolute', function(e) {
                $('body').find('.alert-absolute').remove();
            })
            $(window)
                .off('resize.alert-absolute')
                .on('resize.alert-absolute', function(e) {
                $('body').find('.alert-absolute').remove();
            })

            $alert.addClass('alert-' + options.type)
            if (options.pulsate) {
                $alert.find('h4').addClass('pulsate');
            }
            if (!options.show_header) {
                $alert.find('h4').hide();
            }
            $('body').append($alert);
            $alert.css('top', 0);
            if (options.align === 'right') {
                if (container) {
                    pos = $(window).width() - (container.offset().left + container.width())
                }
                $alert.css('right', pos);
            }
            else {
                if (container) {
                    pos = container.offset().left;
                }
                $alert.css('left', pos);
            }
            $alert.show();
        },

        alert_error: function(message, options) {
            options = $.extend({}, options);
            options.type = 'error';
            this.alert(message, options);
        },

        alert_success: function(message, options) {
            options = $.extend({}, options);
            options.type = 'success';
            this.alert(message, options);
        },

        message: function(mess, options) {
            var self = this,
                default_options = {
                    title: '',
                    width: 400,
                    form_header: true,
                    height: undefined,
                    margin: undefined,
                    buttons: undefined,
                    default_button: undefined,
                    print: false,
                    text_center: false,
                    button_min_width: 100,
                    center_buttons: false,
                    close_button: true,
                    close_on_escape: true
                },
                buttons,
                key,
                el = '',
                $element,
                $modal_body,
                $button = $('<button type="button" class="btn">OK</button>'),
                timeOut;

            if (mess instanceof jQuery) {
                mess = mess.clone()
            }
            options = $.extend({}, default_options, options);
            buttons = options.buttons;

            el = '<div class="modal-body"></div>';
            if (!this.is_empty_obj(buttons)) {
                el += '<div class="modal-footer"></div>';
            }

            $element = this._create_form_header($(el), options);

            $modal_body = $element.find('.modal-body');

            if (options.margin) {
                $modal_body.css('margin', options.margin);
            }

            $modal_body.html(mess);

            if (!options.title) {
                $element.find('.modal-header').remove();
            }

            if (options.text_center) {
                $modal_body.html(mess).addClass("text-center");
            }
            if (options.center_buttons) {
                $element.find(".modal-footer").css("text-align", "center");
            }

            $element.find("#close-btn").click(function(e) {
                $element.modal('hide');
            });

            for (key in buttons) {
                if (buttons.hasOwnProperty(key)) {
                    $element.find(".modal-footer").append(
                        $button.clone()
                        .data('key', key)
                        .css("min-width", options.button_min_width)
                        .html(key)
                        .click(function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            var key = $(this).data('key');
                            setTimeout(function() {
                                    try {
                                        if (buttons[key]) {
                                            buttons[key].call(self);
                                        }
                                    }
                                    catch (e) {}
                                    $element.modal('hide');
                                },
                                100
                            );
                        })
                    );
                }
            }

            $element.on("show hide hidden", function(e) {
                if (e.target === $element.get(0)) {
                    e.stopPropagation();
                }
            });

            $element.on("shown", function(e) {
                if (e.target === $element.get(0)) {
                    self._focus_form($element);
                    e.stopPropagation();
                }
            });

            $element.on("keyup keydown", function(e) {
                var event;
                e.stopPropagation();
                if (e.which === 37 || e.which === 39) {
                    event = jQuery.Event(e.type);
                    event.which = e.which + 1;
                    $(e.target).trigger(event);
                }
                else if (e.which === 80 && e.ctrlKey) {
                    e.preventDefault();
                    self.print_html($element.find(".modal-body"));
                }
            });

            $element.modal({
                width: options.width,
                height: options.height,
                keyboard: options.close_on_escape
            });
            return $element;
        },

        question: function(mess, yesCallback, noCallback, options) {
            var buttons = {},
                default_options = {
                    buttons: buttons,
                    margin: "40px 20px",
                    text_center: true,
                    center_buttons: true
                };
            options = $.extend({}, default_options, options);
            buttons[language.yes] = yesCallback;
            buttons[language.no] = noCallback;
            return this.message(mess, options);
        },

        warning: function(mess, callback, options) {
            var buttons = {"OK": callback},
                default_options = {
                    buttons: buttons,
                    margin: "40px 20px",
                    text_center: true,
                    center_buttons: true
                }
            options = $.extend({}, default_options, options);
            return this.message(mess, options);
        },

        show_message: function(mess, options) {
            return this.message(mess, options);
        },

        hide_message: function($element) {
            $element.modal('hide');
        },

        yes_no_cancel: function(mess, yesCallback, noCallback, cancelCallback) {
            var buttons = {};
            buttons[language.yes] = yesCallback;
            buttons[language.no] = noCallback;
            buttons[language.cancel] = cancelCallback;
            return this.message(mess, {
                buttons: buttons,
                margin: "40px 20px",
                text_center: true,
                width: 500,
                center_buttons: true
            });
        },

        display_history: function(hist) {
            var self = this,
                html = '',
                acc_div = $('<div class="accordion history-accordion" id="history_accordion">'),
                item,
                master,
                lookups = {},
                lookup_keys,
                lookup_fields,
                keys,
                fields,
                where,
                lookup_item,
                mess;
            if (self.master) {
                master = self.master.copy({handlers: false});
                item = master.item_by_ID(self.ID);
                master.open({open_empty: true});
                master.append();
            }
            else {
                item = self.copy({handlers: false, details: false});
            }
            item.open({open_empty: true});
            item.append();
            hist.each(function(h) {
                var acc = $(
                    '<div class="accordion-group history-group">' +
                        '<div class="accordion-heading history-heading">' +
                            '<a class="accordion-toggle history-toggle" data-toggle="collapse" data-parent="#history_accordion" href="#history_collapse' + h.rec_no + '">' +
                            '</a>' +
                        '</div>' +
                        '<div id="history_collapse' + h.rec_no + '" class="accordion-body collapse">' +
                            '<div class="accordion-inner history-inner">' +
                            '</div>' +
                        '</div>' +
                     '</div>'
                    ),
                    i,
                    user = '',
                    content = '',
                    old_value,
                    new_value,
                    val_index,
                    field,
                    field_name,
                    changes,
                    field_arr;
                changes = h.changes.value;
                if (changes && changes[0] === '0') {
                    changes = changes.substring(1);
                    changes = JSON.parse(changes);
                }
                if (h.operation.value === consts.RECORD_DELETED) {
                    content = '<p>Record deleted</p>'
                }
                else if (changes) {
                    field_arr = changes;
                    if (field_arr) {
                        for (i = 0; i < field_arr.length; i++) {
                            field = item.field_by_ID(field_arr[i][0]);
                            val_index = 1;
                            if (field_arr[i].length === 3) {
                                val_index = 2;
                            }
                            if (field && !field.system_field()) {
                                field_name = field.field_caption;
                                if (field.lookup_item) {
                                    if (!lookups[field.lookup_item.ID]) {
                                        lookups[field.lookup_item.ID] = [];
                                    }
                                    field.set_data(field_arr[i][val_index]);
                                    new_value = field.value;
                                    if (new_value) {
                                        lookups[field.lookup_item.ID].push([field.lookup_field, new_value]);
                                        new_value = '<span class="' + field.lookup_field + '_' + new_value + '">' + language.value_loading + '</span>'
                                    }
                                }
                                else {
                                    field.set_data(field_arr[i][val_index]);
                                    new_value = field.display_text;
                                    if (field.raw_value === null) {
                                        new_value = ' '
                                    }
                                }
                                if (h.operation.value === consts.RECORD_INSERTED) {
                                    content += '<p>' + self.task.language.field + ' <b>' + field_name + '</b>: ' +
                                        self.task.language.new_value + ': <b>' + new_value + '</b></p>';
                                }
                                else if (h.operation.value === consts.RECORD_MODIFIED) {
                                    content += '<p>' + self.task.language.field + ' <b>' + field_name + '</b>: ' +
                                        self.task.language.new_value + ': <b>' + new_value + '</b></p>';
                                }
                            }
                        }
                    }
                }
                if (h.user.value) {
                    user = self.task.language.by_user + ' ' + h.user.value;
                }
                acc.find('.accordion-toggle').html(h.date.format_date_to_string(h.date.value, '%d.%m.%Y %H:%M:%S') + ': ' +
                    h.operation.display_text + ' ' + user);
                acc.find('.accordion-inner').html(content);
                if (h.rec_no === 0) {
                    acc.find('.accordion-body').addClass('in');
                }
                acc_div.append(acc)
            })
            if (hist.record_count()) {
                html = acc_div;
            }
            mess = self.task.message(html, {width: 700, height: 600,
                title: hist.item_caption + ': ' + self.item_caption, footer: false, print: true});
            acc_div = mess.find('#history_accordion.accordion');
            for (var ID in lookups) {
                if (lookups.hasOwnProperty(ID)) {
                    lookup_item = self.task.item_by_ID(parseInt(ID, 10));
                    if (lookup_item) {
                        lookup_item = lookup_item.copy({handlers: false});
                        lookup_keys = {};
                        lookup_fields = {};
                        lookup_fields[lookup_item._primary_key] = true;
                        for (var i = 0; i < lookups[ID].length; i++) {
                            lookup_fields[lookups[ID][i][0]] = true;
                            lookup_keys[lookups[ID][i][1]] = true;
                        }
                        keys = [];
                        for (var key in lookup_keys) {
                            if (lookup_keys.hasOwnProperty(key)) {
                                keys.push(parseInt(key, 10));
                            }
                        }
                        fields = [];
                        for (var field in lookup_fields) {
                            if (lookup_fields.hasOwnProperty(field)) {
                                fields.push(field);
                            }
                        }
                        where = {}
                        where[lookup_item._primary_key + '__in'] = keys
                        lookup_item.open({where: where, fields: fields}, function() {
                            var lookup_item = this;
                            lookup_item.each(function(l) {
                                l.each_field(function(f) {
                                    if (!f.system_field()) {
                                        acc_div.find("." + f.field_name + '_' + l._primary_key_field.value).text(f.value);
                                    }
                                });
                            });
                        })
                    }
                }
            }
        },

        show_history: function() {
            var self = this,
                item_id = this.ID,
                hist = this.task.history_item.copy();
            if (!this.rec_count) {
                this.warning(language.no_record);
                return;
            }
            if (this.master) {
                item_id = this.prototype_ID;
            }
            hist.set_where({item_id: item_id, item_rec_id: this.field_by_name(this._primary_key).value})
            hist.set_order_by(['-date']);
            hist.open(function() {
                self.display_history(hist);
            });
        },

        is_empty_obj: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        },

        emptyFunc: function() {},

        abort: function(message) {
            message = message ? ' - ' + message : '';
            throw 'execution aborted: ' + this.item_name + message;
        },

        log_message: function(message) {
            if (this.task.settings.DEBUGGING) {
                message = message ? ' message: ' + message : '';
                console.log(this.item_name + message);
            }
        }
    };

    /**********************************************************************/
    /*                             Task class                             */
    /**********************************************************************/

    Task.prototype = new AbsrtactItem();

    function Task(item_name, caption) {
        var self = this;
        AbsrtactItem.call(this, undefined, 0, item_name, caption, true);
        this.task = this;
        this.user_info = {};
        this._script_cache = {};
        this.gridId = 0;
        this.events = {};
        this.form_options = {
            left: undefined,
            top: undefined,
            title: '',
            fields: [],
            form_header: true,
            form_border: true,
            close_button: true,
            close_on_escape: true,
            close_focusout: false,
            print: false,
            width: 0,
            tab_id: ''
        };
        this.edit_options = $.extend({}, this.form_options, {
            history_button: true,
            edit_details: [],
            detail_height: 0,
            modeless: false
        });
        this.view_options = $.extend({}, this.form_options, {
            history_button: true,
            refresh_button: true,
            enable_search: true,
            search_field: undefined,
            enable_filters: true,
            view_detail: undefined,
            detail_height: 0,
        });
        this.table_options = {
            multiselect: false,
            dblclick_edit: true,
            height: 0,
            row_count: 0,
            row_line_count: 1,
            expand_selected_row: 0,
            freeze_count: 0,
            sort_fields: [],
            edit_fields: [],
            summary_fields: []
        };
        this.constructors = {
            task: Task,
            group: Group,
            item: Item,
            detail: Detail
        };
    }

    $.extend(Task.prototype, {
        constructor: Task,

        consts: consts,

        getChildClass: function() {
            return Group;
        },

        process_request: function(request, item, params, callback) {
            var self = this,
                date = new Date().getTime(),
                async = false,
                statusCode = {},
                contentType = "application/json;charset=utf-8",
                reply;

            if (callback) {
                async = true;
            }
            if (this.ajaxStatusCode) {
                statusCode = this.ajaxStatusCode;
            }

            $.ajax({
                url: "api",
                type: "POST",
                contentType: contentType,
                async: async,
                cache: false,
                data: JSON.stringify([request, this.ID, item.ID, params, date]),
                statusCode: statusCode,
                success: function(data) {
                    var mess;
                    if (data.error) {
                        console.log(data);
                    } else {
                        if (data.result.status === consts.NO_PROJECT) {
                            $('body').empty();
                            item.warning(language.no_task);
                            return;
                        } else if (data.result.status === consts.UNDER_MAINTAINANCE) {
                            if (!self.task._under_maintainance) {
                                self.task._under_maintainance = true;
                                if (language) {
                                    mess = language.website_maintenance;
                                } else {
                                    mess = 'Web site currently under maintenance.';
                                }
                                item.warning(mess, function() {
                                    self.task._under_maintainance = undefined;
                                });
                            }
                            return;
                        } else if (data.result.status === consts.NOT_LOGGED) {
                            if (!self.logged_in) {
                                self.login();
                            } else {
                                location.reload();
                            }
                            return;
                        } else if (self.ID > 0 && data.result.version &&
                            self.version && data.result.version !== self.version) {
                            if (!self.task._version_changed) {
                                self.task._version_changed = true;
                                self.message('<h4>' + language.version_changed + '</h4>', {
                                    margin: '40px 40px',
                                    width: 500,
                                    text_center: true
                                });
                            }
                            return;
                        }
                    }
                    if (callback) {
                        callback.call(item, data.result.data);
                    } else {
                        reply = data.result.data;
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    if (jqXHR.responseText && self.ID !== 0) {
                        document.open();
                        document.write(jqXHR.responseText);
                        document.close();
                    } else if (language) {
                        task.alert_error(language.server_request_error);
                        if (callback) {
                            callback.call(item, [null, language.server_request_error]);
                        }
                    }
                },
                fail: function(jqXHR, textStatus, errorThrown) {
                    console.log('ajax fail: ', jqXHR, textStatus, errorThrown);
                }
            });
            if (reply !== undefined) {
                return reply;
            }
        },

        _byteLength: function(str) {
            var s = str.length;
            for (var i = str.length - 1; i >= 0; i--) {
                var code = str.charCodeAt(i);
                if (code > 0x7f && code <= 0x7ff) s++;
                else if (code > 0x7ff && code <= 0xffff) s += 2;
                if (code >= 0xDC00 && code <= 0xDFFF) i--;
            }
            return s;
        },

        do_upload: function(path, file_info, options) {
            var self = this,
                i,
                file,
                files = [],
                content,
                header = '',
                body = [],
                div_chr = ';',
                xhr = new XMLHttpRequest(),
                user_info = this.ID + ';' + this.item_name;
            header += user_info.length + ';' + user_info + div_chr;
            header += file_info.length + div_chr;
            header += this._byteLength(path) + div_chr;
            for (i = 0; i < file_info.length; i++) {
                file = file_info[i][0];
                content = file_info[i][1];
                header += this._byteLength(file.name) + div_chr;
                header += content.byteLength + div_chr;
                files.push(file.name);
            }
            body.push(header);
            body.push(path);
            for (i = 0; i < file_info.length; i++) {
                file = file_info[i][0];
                content = file_info[i][1];
                body.push(file.name);
                body.push(content);
            }
            xhr.open('POST', 'upload', true);
            if (options.callback) {
                xhr.onload = function(e) {
                    if (options.multiple) {
                        options.callback.call(self, files);
                    } else {
                        options.callback.call(self, files[0]);
                    }
                };
            }
            if (options.on_progress) {
                xhr.upload.onprogress = function(e) {
                    options.on_progress.call(self, self, e);
                };
            }
            var blob = new Blob(body, {
                type: 'application/octet-stream'
            });
            xhr.send(blob);
        },

        upload: function(path, options) {
            var self = this,
                default_options = {
                    callback: undefined,
                    on_progress: undefined,
                    extension: undefined,
                    multiple: false
                },
                button = $('<input type="file" style="position: absolute; top: -100px"/>');
            options = $.extend({}, default_options, options);
            if (options.multiple) {
                button.attr('multiple', 'multiple');
            }
            $('body').append(button);
            button.on('change', function(e) {
                var files = e.target.files,
                    i,
                    parts,
                    ext,
                    f,
                    file,
                    file_info = [],
                    reader,
                    file_list = [];

                for (i = 0, f; f = files[i]; i++) {
                    ext = '';
                    if (options.extension) {
                        parts = f.name.split('.');
                        if (parts.length) {
                            ext = parts[parts.length - 1];
                        }
                        if (ext !== options.extension) {
                            continue;
                        }
                    }
                    file_list.push(f);
                }
                for (i = 0; i < file_list.length; i++) {
                    file = file_list[i];
                    reader = new FileReader();
                    reader.onload = (function(cur_file) {
                        return function(e) {
                            file_info.push([cur_file, e.target.result]);
                            if (file_info.length === file_list.length) {
                                self.do_upload(path, file_info, options);
                            }
                        };
                    })(file);
                    reader.readAsArrayBuffer(file);
                }
                button.remove();
            });
            button.click();
        },

        load: function() {
            var self = this;
            this.send_request('connect', null, function(success) {
                if (success) {
                    self.load_task();
                }
                else {
                    self.login();
                }
            });
        },

        login: function() {
            var self = this,
                info,
                $form;
            if (this.templates) {
                $form = this.templates.find("#login-form").clone();
            } else {
                $form = $("#login-form").clone();
            }

            $form = this._create_form_header($form, {
                title: $form.data('caption'),
                form_header: true
            });

            $form.find("#login-btn").click(function(e) {
                var login = $form.find("#inputLoging").val(),
                    passWord = $form.find("#inputPassword").val();
                    //~ pswHash = hex_md5(passWord);
                e.preventDefault();
                if (login && passWord) {
                    self.send_request('login', [login, passWord], function(success) {
                        if (success) {
                            if ($form) {
                                $form.modal('hide');
                            }
                            self.load_task();
                        }
                    });
                }
            });

            $form.find("#close-btn").click(function(e) {
                $form.modal('hide');
            });

            $form.on("shown", function(e) {
                $form.find("#inputLoging").focus();
                e.stopPropagation();
            });

            $form.find('input').keydown(function(e) {
                var $this = $(this),
                    code = (e.keyCode ? e.keyCode : e.which);
                if (code === 40) {
                    if ($this.attr('id') === 'inputLoging') {
                        $form.find('#inputPassword').focus();
                    } else {
                        $form.find('#login-btn').focus();
                    }
                }
            });

            $form.modal({
                width: 500
            });
        },

        logout: function() {
            this.send_request('logout');
            location.reload();
        },

        load_task: function() {
            var self = this,
                info;
            this.send_request('load', null, function(data) {
                var info = data[0],
                    error = data[1],
                    templates;
                if (error) {
                    self.warning(error);
                    return;
                }
                self.logged_in = true;
                settings = info.settings;
                locale = info.locale;
                language = info.language;
                self.settings = settings;
                self.language = language;
                self.locale = locale;
                self.user_info = info.user_info;
                self.user_privileges = info.privileges;
                self.consts = consts;
                self.safe_mode = self.settings.SAFE_MODE;
                self.forms_in_tabs = self.settings.FORMS_IN_TABS;
                self.full_width = self.settings.FULL_WIDTH;
                self.version = self.settings.VERSION;
                self.ID = info.task.id;
                self.item_name = info.task.name;
                self.item_caption = info.task.caption;
                self.visible = info.task.visible;
                self.lookup_lists = info.task.lookup_lists;
                self.history_item = info.task.history_item;
                self.item_type = "";
                if (info.task.type) {
                    self.item_type = self.types[info.task.type - 1];
                }
                if (info.task.js_filename) {
                    self.js_filename = 'js/' + info.task.js_filename;
                }
                self.task = self;
                self.templates = $("<div></div>");
                templates = $(".templates");
                self.templates = templates.clone();
                templates.remove();
                self.init(info.task);
                self.bind_items();
                if (self.ID === 0) {
                    self.js_filename = 'jam/js/admin.js';
                    self.settings.DYNAMIC_JS = false;
                }
                if (self.static_js_modules) {
                    self.bind_events();
                    self._page_loaded();
                }
                else {
                    self.init_modules();
                }
                if (self.history_item) {
                    self._set_history_item(self.item_by_ID(self.history_item))
                }
            });
        },

        _page_loaded: function() {
            if (locale.RTL) {
                $('html').attr('dir', 'rtl')
            }
            if (this.on_page_loaded) {
                this.on_page_loaded.call(this, this);
            }
        },

        _set_history_item: function(item) {
            var self = this,
                doc_name;
            this.history_item = item;
            if (this.history_item) {
                this.history_item.read_only = true;
                item.view_options.fields = ['item_id', 'item_rec_id', 'date', 'operation', 'user'];
                if (!item.on_field_get_text) {
                    item.on_field_get_text = function(field) {
                        var oper,
                            it;
                        if (field.field_name === 'operation') {
                            if (field.value === consts.RECORD_INSERTED) {
                                return self.language.created;
                            }
                            else if (field.value === consts.RECORD_MODIFIED ||
                                field.value === consts.RECORD_DETAILS_MODIFIED) {
                                return self.language.modified;
                            }
                            else if (field.value === consts.RECORD_DELETED) {
                                return self.language.deleted;
                            }
                        }
                        else if (field.field_name === 'item_id') {
                            it = self.item_by_ID(field.value);
                            if (it) {
                                doc_name = it.item_caption;
                                return doc_name;
                            }
                        }
                    }
                }
                this.history_item.edit_record = function() {
                    var it = item.task.item_by_ID(item.item_id.value),
                        hist = item.task.history_item.copy();
                    hist.set_where({item_id: item.item_id.value, item_rec_id: item.item_rec_id.value});
                    hist.set_order_by(['-date']);
                    hist.open(function() {
                        it.display_history(hist);
                    });
                }
            }
        },

        init_modules: function() {
            var self = this,
                mutex = 0,
                calcback_executing = false,
                calc_modules = function(item) {
                    if (item.js_filename) {
                        mutex++;
                    }
                },
                load_script = function(item) {
                    if (item.js_filename) {
                        item.load_script(
                            item.js_filename,
                            function() {
                                if (--mutex === 0) {
                                    self.bind_events();
                                    if (!calcback_executing) {
                                        calcback_executing = true;
                                        self._page_loaded();
                                    }
                                }
                            }
                        );
                    }
                };

            if (this.settings.DYNAMIC_JS) {
                mutex = 1;
                load_script(this);
            } else {
                this.all(calc_modules);
                this.all(load_script);
            }
        },

        has_privilege: function(item, priv_name) {
            var priv_dic;
            if (item.task.ID === 0) {
                return true;
            }
            if (!this.user_privileges) {// || item.master) {
                return true;
            } else {
                if (!this.user_privileges) {
                    return false;
                }
                try {
                    priv_dic = this.user_privileges[item.ID];
                } catch (e) {
                    priv_dic = null;
                }
                if (priv_dic) {
                    return priv_dic[priv_name];
                } else {
                    return false;
                }
            }
        },

        create_cookie: function(name, value, days) {
            var expires;

            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            } else {
                expires = "";
            }
            document.cookie = escape(name) + "=" + escape(value) + expires + "; path=/";
        },

        read_cookie: function(name) {
            var nameEQ = escape(name) + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) return unescape(c.substring(nameEQ.length, c.length));
            }
            return null;
        },

        erase_cookie: function(name) {
            this.create_cookie(name, "", -1);
        },

        create_menu: function($menu, options) {
            var i,
                j,
                li,
                ul,
                menu = [],
                group,
                item,
                default_options = {
                    view_first: false,
                };
            options = $.extend({}, default_options, options);

            task.each_item(function(group) {
                var items = [];
                if (group.visible) {
                    group.each_item(function(item) {
                        if (item.visible && item.can_view()) {
                            items.push(item);
                        }
                    });
                    if (items.length) {
                        menu.push({group: group, items: items});
                    }
                }
            });

            for (i = 0; i < menu.length; i++) {
                group = menu[i].group;
                if (menu[i].items.length == 1) {
                    ul = $menu;
                }
                else {
                    li = $('<li class="dropdown"><a class="dropdown-toggle" data-toggle="dropdown" href="#">' +
                        group.item_caption + ' <b class="caret"></b></a></li>');
                    $menu.append(li);
                    ul = $('<ul class="dropdown-menu">');
                    li.append(ul);
                }
                for (j = 0; j < menu[i].items.length; j++) {
                    item = menu[i].items[j];
                    ul.append($('<li>')
                        .append($('<a class="item-menu" href="#">' + item.item_caption + '</a>')
                        .data('item', item)));

                }
            }
            $menu.find('.item-menu').on('click', (function(e) {
                var item = $(this).data('item');
                e.preventDefault();
                if (item.item_type === "report") {
                    item.print(false);
                }
                else {
                    item.view($("#content"));
                }
            }));

            if (options.view_first) {
                $menu.find('.item-menu:first').click();
            }
        },

        _tab_content: function(tab) {
            var item_name = tab.find('a').attr('href').substr(1);
            return tab.parent().parent().find('> div.tab-content > div.' + item_name)
        },

        _show_tab: function(tab) {
            var item_name = tab.find('a').attr('href').substr(1),
                el,
                tab_content = this._tab_content(tab),
                tab_div = tab.parent().parent().parent();
            tab_div.find('> .tabbable > div.tab-content > div.tab-pane').removeClass('active');
            tab_content.addClass('active').trigger('tab_active_changed');
            tab_div.find('> .tabbable > ul.nav-tabs > li').removeClass('active');
            tab.addClass('active');
            el = tab_content.data('active_el');
            if (el) {
                el.focus();
            }
            tab_content.on('tab_active_changed', function() {
                var form = tab_content.find('.jam-form:first');
                if (form.length) {
                    form.trigger('active_changed');
                }
            });
        },

        show_tab: function(container, tab_id) {
            var tab = container.find('> .tabbable > ul.nav-tabs > li a[href="#' + tab_id + '"]');
            if (tab.length) {
                this._show_tab(tab.parent());
            }
        },

        _close_tab: function(tab) {
            var tabs = tab.parent(),
                tab_content = this._tab_content(tab),
                new_tab;
            this._show_tab(tab);
            if (tab.next().length) {
                new_tab = tab.next()
            }
            else {
                new_tab = tab.prev()
            }
            this._tab_content(tab).remove()
            tab.remove();
            if (new_tab.length) {
                this._show_tab(new_tab);
            }
        },

        close_tab: function(container, tab_id) {
            var tab = container.find('> .tabbable > ul.nav-tabs > li a[href="#' + tab_id + '"]');
            if (tab.length) {
                this._close_tab(tab.parent());
            }
        },

        set_forms_container: function(container) {
            if (container && container.length) {
                this.forms_container = container;
                if (this.forms_in_tabs) {
                    this.init_tabs(container);
                }
            }
        },

        init_tabs: function(container, tabs_position) {
            var self = this,
                div;
            if (!tabs_position) {
                tabs_position = 'tabs-top'
            }
            div = $('<div class="tabbable ' + tabs_position + '">');
            container.empty();
            container.append(div);
            if (tabs_position === 'tabs-below') {
                div.append('<div class="tab-content">');
                div.append('<ul class="nav nav-tabs">');
            }
            else {
                div.append('<ul class="nav nav-tabs">');
                div.append('<div class="tab-content">');
            }
        },

        can_add_tab: function(container) {
            return container.find('> .tabbable  > ul.nav-tabs').length > 0
        },

        add_tab: function(container, tab_name, options) {
            var self = this,
                div,
                tabs,
                active_tab,
                tab_content,
                tab_text,
                cur_tab,
                cur_tab_content;
            if (!container.length) {
                this.warning('Container must be specified.')
            }
            if (!tab_name) {
                this.warning('Tab name must be specified.')
            }
            if (!options) {
                options = {};
            }
            if (this.can_add_tab(container)) {
                tabs = container.find('> .tabbable > ul.nav-tabs');
                if (!options.tab_id) {
                    options.tab_id = 'tab' + tabs.find('> li').length + 1;
                }
                active_tab = tabs.find('> li.active');
                cur_tab = tabs.find('> li a[href="#' + options.tab_id + '"]');
                if (cur_tab.length) {
                    cur_tab = cur_tab.parent();
                }
                else {
                    tab_content = container.find('> .tabbable > div.tab-content');
                    if (options.show_close_btn) {
                        tab_name = '<span> ' + tab_name + ' </span><i class="icon-remove close-tab-btn"></i>';
                    }
                    cur_tab = $('<li><a href="#' + options.tab_id + '">' +
                        tab_name + '</a></li>');
                    tabs.append(cur_tab);
                    cur_tab_content = $('<div class="tab-pane ' + options.tab_id + '"></div>');
                    tab_content.append(cur_tab_content);
                    cur_tab.on('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        self._show_tab($(this));
                    });
                    cur_tab_content.on('focusout', function(e) {
                        var found;
                        $(e.target).parents().each(function() {
                            if (this === cur_tab_content.get(0)) {
                                cur_tab_content.data('active_el', e.target);
                                return false;
                            }
                        })
                    });
                    if (options.show_close_btn) {
                        cur_tab.on('click', '.close-tab-btn', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (options.on_close) {
                                options.on_close.call();
                            }
                            else {
                                self.close_tab(container, options.tab_id);
                            }
                        });
                    }
                }
                if (options.set_active || !active_tab.length) {
                    this.show_tab(container, options.tab_id);
                }
                return cur_tab_content
            }
        }
    });


    /**********************************************************************/
    /*                           Group class                              */
    /**********************************************************************/

    Group.prototype = new AbsrtactItem();

    function Group(owner, ID, item_name, caption, visible, type, js_filename) {
        AbsrtactItem.call(this, owner, ID, item_name, caption, visible, type, js_filename);
    }

    $.extend(Group.prototype, {
        constructor: Group,

        getChildClass: function() {
            if (this.item_type === "reports") {
                return Report;
            } else {
                return Item;
            }
        },

        //~ add_item: function(item_name, item_caption, fields, filters, on_open, on_count) {
            //~ var result,
                //~ attr,
                //~ val,
                //~ data_type,
                //~ field_type,
                //~ lookup_item,
                //~ field_def;
            //~ result = new Item(this, -1, item_name, item_caption, true, 10);
            //~ result.field_defs = [];
            //~ for (var i = 0; i < fields.length; i++) {
                //~ field_def = []
                //~ for (var j = 0; j < field_attr.length; j++) {
                    //~ attr = field_attr[j];
                    //~ if (attr.charAt(0) === '_') {
                        //~ attr = attr.substr(1);
                    //~ }
                    //~ val = fields[i][attr]
                    //~ switch (attr) {
                        //~ case 'ID':
                            //~ val = i + 1;
                            //~ break;
                        //~ case 'data_type':
                            //~ field_type = fields[i]['field_type']
                            //~ val = field_type_names.indexOf(field_type);
                            //~ if (val < 1) {
                                //~ val = 1;
                            //~ }
                            //~ data_type = val;
                            //~ break;
                        //~ case 'field_size':
                            //~ if (data_type === 1 && !val) {
                                //~ val = 99999;
                            //~ }
                            //~ break;
                        //~ case 'lookup_item':
                            //~ if (val) {
                                //~ lookup_item = val;
                                //~ val = val.ID
                            //~ }
                            //~ break;
                        //~ case 'lookup_field':
                            //~ break;
                    //~ }
                    //~ field_def.push(val);
                //~ }
                //~ result.field_defs.push(field_def);
            //~ }
            //~ for (i = 0; i < result.field_defs.length; i++) {
                //~ new Field(result, result.field_defs[i]);
            //~ }
            //~ result._prepare_fields();

            //~ result.filter_defs = [];
            //~ for (i = 0; i < filters.length; i++) {
                //~ filter_def = []
                //~ for (var j = 0; j < filter_attr.length; j++) {
                    //~ attr = filter_attr[j];
                    //~ val = filters[i][attr]
                    //~ switch (attr) {
                        //~ case 'filter_type':
                            //~ val = filter_value.indexOf(val);
                            //~ break;
                    //~ }
                    //~ filter_def.push(val);
                //~ }
                //~ result.filter_defs.push(filter_def);
            //~ }
            //~ for (i = 0; i < result.filter_defs.length; i++) {
                //~ new Filter(this, result.filter_defs[i]);
            //~ }
            //~ result._prepare_filters();
            //~ result.on_open = on_open;
            //~ result.on_count = on_count;
            //~ return result;
        //~ }
    });

    /**********************************************************************/
    /*                         ChangeLog class                            */
    /**********************************************************************/

    function ChangeLog(item) {
        this.item = item;
        this._change_id = 0;
        this.records = [];
        this.logs = {};
        this.fields = [];
        this.expanded = true;
    }

    ChangeLog.prototype = {
        constructor: ChangeLog,

        get_change_id: function() {
            this._change_id += 1;
            return this._change_id + '';
        },

        is_empty_obj: function(obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        },

        log_changes: function() {
            if (this.item.master) {
                return this.item.master.change_log.log_changes();
            } else {
                return this.item.log_changes;
            }
        },

        find_record_log: function() {
            var result,
                record_log,
                details,
                detail,
                i,
                len,
                fields = [],
                change_id;
            if (this.item.master) {
                record_log = this.item.master.change_log.find_record_log();
                if (record_log) {
                    details = record_log.details;
                    detail = details[this.item.ID];
                    if (this.is_empty_obj(detail)) {
                        len = this.item.fields.length;
                        for (i = 0; i < len; i++) {
                            fields.push(this.item.fields[i].field_name);
                        }
                        detail = {
                            logs: {},
                            records: this.item._dataset,
                            fields: fields,
                            expanded: this.item.expanded
                        };
                        details[this.item.ID] = detail;
                    }
                    this.logs = detail.logs;
                    this.records = detail.records;
                    this.fields = detail.fields;
                    this.expanded = detail.expanded;
                }
            }
            if (this.item.record_count()) {
                change_id = this.item._get_rec_change_id();
                if (!change_id) {
                    change_id = this.get_change_id()
                    this.item._set_rec_change_id(change_id);
                }
                result = this.logs[change_id];
                if (this.is_empty_obj(result)) {
                    result = {
                        old_record: null,
                        record: this.cur_record(),
                        details: {}
                    };
                    this.logs[change_id] = result;
                }
            }
            return result;
        },

        get_detail_log: function(detail_ID) {
            var result,
                record_log,
                details;
            record_log = this.find_record_log();
            details = record_log.details;
            if (!this.is_empty_obj(details)) {
                result = details[detail_ID];
            }
            if (result === undefined && this._is_delta) {
                result = {
                    records: [],
                    fields: [],
                    expanded: false,
                    logs: {}
                };
            }
            return result;
        },

        remove_record_log: function() {
            var change_id = this.item._get_rec_change_id();
            if (change_id) {
                this.find_record_log();
                delete this.logs[change_id];
                this.item._set_rec_change_id(null);
                this.item._set_record_status(consts.RECORD_UNCHANGED);
            }
        },

        cur_record: function() {
            return this.item._dataset[this.item._get_rec_no()];
        },

        record_modified: function(record_log) {
            var modified = false,
                old_rec = record_log.old_record,
                cur_rec = record_log.record;
            for (var i = 0; i < this.item._record_lookup_index; i++) {
                if (old_rec[i] !== cur_rec[i]) {
                    modified = true;
                    break;
                }
            }
            return modified;
        },

        copy_record: function(record, expanded) {
            var result = null,
                info;
            if (record) {
                if (expanded === undefined) {
                    expanded = true;
                }
                if (expanded) {
                    result = record.slice(0, this.item._record_info_index);
                } else {
                    result = record.slice(0, this.item._record_lookup_index);
                }
                info = this.item.get_rec_info(undefined, record);
                result.push([info[0], {},
                    info[2]
                ]);
            }
            return result;
        },

        can_log_changes: function() {
            var result = this.log_changes();
            if (this.item.item_state === consts.STATE_EDIT) {}
        },

        log_change: function() {
            var record_log;
            if (this.log_changes()) {
                record_log = this.find_record_log();
                if (this.item.item_state === consts.STATE_BROWSE) {
                    if ((this.item._get_record_status() === consts.RECORD_UNCHANGED) ||
                        (this.item._get_record_status() === consts.RECORD_DETAILS_MODIFIED && record_log.old_record === null)) {
                        record_log.old_record = this.copy_record(this.cur_record(), false);
                        return;
                    }
                } else if (this.item.item_state === consts.STATE_INSERT) {
                    this.item._set_record_status(consts.RECORD_INSERTED);
                } else if (this.item.item_state === consts.STATE_EDIT) {
                    if (this.item._get_record_status() === consts.RECORD_UNCHANGED) {
                        this.item.record_status = consts.RECORD_MODIFIED;
                    } else if (this.item._get_record_status() === consts.RECORD_DETAILS_MODIFIED) {
                        if (this.record_modified(record_log)) {
                            this.item._set_record_status(consts.RECORD_MODIFIED);
                        }
                    }
                } else if (this.item.item_state === consts.STATE_DELETE) {
                    if (this.item._get_record_status() === consts.RECORD_INSERTED) {
                        this.remove_record_log();
                    } else {
                        this.item._set_record_status(consts.RECORD_DELETED);
                    }
                } else {
                    throw this.item.item_name + ': change log invalid records state';
                }
                if (this.item.master) {
                    if (this.item.master._get_record_status() === consts.RECORD_UNCHANGED) {
                        this.item.master._set_record_status(consts.RECORD_DETAILS_MODIFIED);
                    }
                }
            }
        },

        get_changes: function(result) {
            var data = {},
                record_log,
                record,
                old_record = null,
                info,
                new_record,
                new_details,
                detail_id,
                detail,
                details,
                new_detail,
                detail_item;
            result.fields = this.fields;
            result.expanded = false;
            result.data = data;
            for (var key in this.logs) {
                if (this.logs.hasOwnProperty(key)) {
                    record_log = this.logs[key];
                    record = record_log.record;
                    info = this.item.get_rec_info(undefined, record);
                    if (info[consts.REC_STATUS] !== consts.RECORD_UNCHANGED) {
                        details = record_log.details;
                        if (this.item.keep_history) {
                            old_record = record_log.old_record;
                        }
                        new_record = this.copy_record(record, false)
                        new_details = {};
                        for (var detail_id in details) {
                            if (details.hasOwnProperty(detail_id)) {
                                detail = details[detail_id];
                                new_detail = {};
                                detail_item = this.item.item_by_ID(parseInt(detail_id, 10));
                                detail_item.change_log.logs = detail.logs;
                                detail_item.change_log.get_changes(new_detail);
                                new_details[detail_id] = new_detail;
                            }
                        }
                        data[key] = {
                            record: new_record,
                            details: new_details,
                            old_record: old_record
                        };
                    }
                }
            }
        },

        set_changes: function(changes) {
            var data = changes.data,
                record_log,
                record,
                record_details,
                details,
                detail,
                detail_item;
            this.records = [];
            this.logs = {};
            this.fields = changes.fields
            this.expanded = changes.expanded;
            this._change_id = 0;
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    record_log = data[key];
                    if (this._change_id < parseInt(key, 10)) {
                        this._change_id = parseInt(key, 10);
                    }
                    record = record_log.record;
                    this.records.push(record);
                    details = {};
                    this.logs[key] = {
                        old_record: null,
                        record: record,
                        details: details
                    };
                    record_details = record_log.details;
                    for (var detail_id in record_details) {
                        if (record_details.hasOwnProperty(detail_id)) {
                            detail = record_details[detail_id];
                            detail_item = this.item.item_by_ID(parseInt(detail_id, 10));
                            detail_item.change_log.set_changes(detail);
                            details[detail_id] = {
                                logs: detail_item.change_log.logs,
                                records: detail_item.change_log.records,
                                fields: detail_item.change_log.fields,
                                expanded: detail_item.change_log.expanded
                            };
                        }
                    }
                }
            }
        },

        copy_records: function(records) {
            var i = 0,
                len = records.length,
                result = [];
            for (i = 0; i < len; i++) {
                result.push(records[i].slice(0));
            }
            return result;
        },

        store_details: function(source, dest) {
            var detail_item,
                cur_logs,
                record_log,
                logs,
                cur_records,
                records,
                cur_record,
                record,
                fields,
                expanded,
                index,
                detail,
                detail_id,
                details;
            for (var i = 0; i < this.item.details.length; i++) {
                detail_item = this.item.details[i];
                detail_id = detail_item.ID;
                detail = source[detail_id];
                logs = {};
                records = [];
                fields = [];
                expanded = true;
                if (detail) {
                    cur_logs = detail.logs;
                    cur_records = detail.records;
                    fields = detail.fields;
                    expanded = detail.expanded;
                    records = this.copy_records(cur_records);
                    for (var key in cur_logs) {
                        if (cur_logs.hasOwnProperty(key)) {
                            record_log = cur_logs[key];
                            cur_record = record_log.record;
                            record = detail_item.change_log.copy_record(cur_record);
                            index = cur_records.indexOf(cur_record);
                            if (index !== -1) {
                                records[index] = record;
                            }
                            details = {};
                            detail_item.change_log.store_details(record_log.details, details);
                            logs[key] = {
                                old_record: record_log.old_record,
                                record: record,
                                details: details
                            };
                        }
                    }
                } else {
                    if (detail_item._dataset) {
                        records = this.copy_records(detail_item._dataset);
                    }
                }
                dest[detail_id] = {
                    logs: logs,
                    records: records,
                    fields: fields,
                    expanded: expanded
                };
            }
        },

        store_record_log: function() {
            var record_log,
                details,
                detail,
                result;
            if (this.log_changes()) {
                record_log = this.find_record_log();
                details = {};
                this.store_details(record_log.details, details);
                result = {};
                result.old_record = record_log.old_record;
                result.record = this.copy_record(record_log.record);
                result.details = details;
            } else {
                result = {};
                result.record = this.copy_record(this.cur_record());
                details = {};
                for (var i = 0; i < this.item.details.length; i++) {
                    detail = this.item.details[i];
                    if (!detail.disabled && detail._dataset) {
                        details[detail.ID] = detail._dataset.slice(0);
                    }
                }
                result.details = details;
            }
            return result;
        },

        restore_record_log: function(log) {
            var record_log,
                record,
                detail,
                detail_log,
                cur_record,
                info_index;
            if (this.log_changes()) {
                record_log = this.find_record_log();
                record = log.record;
                cur_record = this.cur_record();
                info_index = this.item._record_info_index;
                for (var i = 0; i < info_index; i++) {
                    cur_record[i] = record[i];
                }
                record_log.old_record = log.old_record;
                record_log.record = cur_record;
                record_log.details = log.details;
                for (var i = 0; i < this.item.details.length; i++) {
                    detail = this.item.details[i];
                    detail_log = log.details[detail.ID];
                    if (!this.is_empty_obj(detail_log)) {
                        detail._dataset = detail_log.records;
                    }
                }
                if (this.item._get_record_status() === consts.RECORD_UNCHANGED) {
                    this.remove_record_log();
                }
            } else {
                record = log.record;
                cur_record = this.cur_record();
                info_index = this.item._record_info_index;
                for (var i = 0; i < info_index; i++) {
                    cur_record[i] = record[i];
                }
                for (var i = 0; i < this.item.details.length; i++) {
                    detail = this.item.details[i];
                    detail._dataset = log.details[detail.ID];
                }
            }
        },

        update: function(updates, master_rec_id) {
            var change,
                changes,
                log_id,
                rec_id,
                detail,
                details,
                record_log,
                record,
                record_details,
                len,
                ID,
                detail_item,
                item_detail,
                info,
                primary_key_field,
                master_rec_id_field;
            if (updates) {
                changes = updates.changes;
                for (var key in changes) {
                    if (changes.hasOwnProperty(key)) {
                        change = changes[key];
                        log_id = change.log_id;
                        rec_id = change.rec_id;
                        details = change.details;
                        record_log = this.logs[log_id];
                        if (record_log) {
                            record = record_log.record;
                            record_details = record_log.details;
                            len = details.length;
                            for (var i = 0; i < len; i++) {
                                detail = details[i];
                                ID = detail.ID;
                                detail_item = this.item.detail_by_ID(parseInt(ID, 10));
                                item_detail = record_details[ID];
                                if (!this.is_empty_obj(item_detail)) {
                                    detail_item.change_log.logs = item_detail.logs;
                                    detail_item.change_log.update(detail, rec_id);
                                }
                            }
                            if (rec_id) {
                                if (!record[this.item._primary_key_field.bind_index]) {
                                    record[this.item._primary_key_field.bind_index] = rec_id;
                                }
                            }
                            if (master_rec_id) {
                                if (!record[this.item._master_rec_id_field.bind_index]) {
                                    record[this.item._master_rec_id_field.bind_index] = master_rec_id;
                                }
                            }
                            info = this.item.get_rec_info(undefined, record);
                            info[consts.REC_STATUS] = consts.RECORD_UNCHANGED;
                            info[consts.REC_CHANGE_ID] = consts.RECORD_UNCHANGED;
                            delete this.logs[log_id];
                        }
                    }
                }
            }
        },

        prepare: function() {
            var log = this,
                i,
                len = this.item.fields.length;

            if (this.item.master) {
                log = this.item.master.change_log.get_detail_log(this.item.ID);
            }
            if (log) {
                log.records = [];
                log.logs = {};
                log.fields = [];
                for (i = 0; i < len; i++) {
                    if (!this.item.fields[i].master_field) {
                        log.fields.push(this.item.fields[i].field_name);
                    }
                }
                log.expanded = this.item.expanded;
            }
        }
    };


    /**********************************************************************/
    /*                            Item class                              */
    /**********************************************************************/

    Item.prototype = new AbsrtactItem();

    function Item(owner, ID, item_name, caption, visible, type, js_filename) {
        var self;
        AbsrtactItem.call(this, owner, ID, item_name, caption, visible, type, js_filename);
        if (this.task && type !== 0 && !(item_name in this.task)) {
            this.task[item_name] = this;
        }
        this.field_defs = [];
        this._fields = [];
        this.fields = [];
        this.filter_defs = [];
        this.filters = [];
        this.details = [];
        this.controls = [];
        this.change_log = new ChangeLog(this);
        this._paginate = false;
        this.disabled = false;
        this.expanded = true;
        this._log_changes = true;
        this._dataset = null;
        this._eof = false;
        this._bof = false;
        this._cur_row = null;
        this._old_row = 0;
        this._old_status = null;
        this._buffer = null;
        this._modified = null;
        this._state = 0;
        this._read_only = false;
        this._active = false;
        this._disabled_count = 0;
        this._open_params = {};
        this._where_list = [];
        this._order_by_list = [];
        this._select_field_list = [];
        this._record_lookup_index = -1
        this._record_info_index = -1
        this._is_delta = false;
        this._limit = 1;
        this._offset = 0;
        this._selections = undefined;
        this.show_selected = false;
        this.selection_limit = 1500;
        this.is_loaded = false;
        if (this.task) {
            this.view_options = $.extend({}, this.task.view_options);
            this.table_options = $.extend({}, this.task.table_options);
            this.edit_options = $.extend({}, this.task.edit_options);
            this.filter_options = $.extend({}, this.task.form_options);
        }
        Object.defineProperty(this, "rec_no", {
            get: function() {
                return this._get_rec_no();
            },
            set: function(new_value) {
                this._set_rec_no(new_value);
            }
        });
        Object.defineProperty(this, "rec_count", {
            get: function() {
                return this.get_rec_count();
            },
        });
        Object.defineProperty(this, "active", {
            get: function() {
                return this._get_active();
            }
        });
        Object.defineProperty(this, "read_only", {
            get: function() {
                return this._get_read_only();
            },
            set: function(new_value) {
                this._set_read_only(new_value);
            }
        });
        Object.defineProperty(this, "filtered", {
            get: function() {
                return this._get_filtered();
            },
            set: function(new_value) {
                this._set_filtered(new_value);
            }
        });
        Object.defineProperty(this, "item_state", {
            get: function() {
                return this._get_item_state();
            },
            set: function(new_value) {
                this._set_item_state(new_value);
            }
        });
        Object.defineProperty(this, "record_status", {
            get: function() {
                return this._get_record_status();
            },
            set: function(new_value) {
                this._set_record_status(new_value);
            }
        });
        Object.defineProperty(this, "default_field", {
            get: function() {
                return this.get_default_field();
            }
        });
        Object.defineProperty(this, "log_changes", {
            get: function() {
                return this._get_log_changes();
            },
            set: function(new_value) {
                this._set_log_changes(new_value);
            }
        });
        Object.defineProperty(this, "dataset", {
            get: function() {
                return this.get_dataset();
            },
            set: function(new_value) {
                this.set_dataset(new_value);
            }
        });
        Object.defineProperty(this, "selections", {
            get: function() {
                return this.get_selections();
            },
            set: function(new_value) {
                this.set_selections(new_value);
            }
        });
        Object.defineProperty(this, "keep_history", {
            get: function() {
                return this.get_keep_history();
            },
        });
        Object.defineProperty(this, "paginate", { //depricated
            get: function() {
                return this._paginate
            },
            set: function(new_value) {
                this._paginate = new_value;
            }
        });
    }

    $.extend(Item.prototype, {

        constructor: Item,

        getChildClass: function() {
            return Detail;
        },

        initAttr: function(info) {
            var i,
                field_defs = info.fields,
                filter_defs = info.filters,
                len;
            if (field_defs) {
                len = field_defs.length;
                for (i = 0; i < len; i++) {
                    this.field_defs.push(field_defs[i]);
                    new Field(this, field_defs[i]);
                }
            }
            if (filter_defs) {
                len = filter_defs.length;
                for (i = 0; i < len; i++) {
                    this.filter_defs.push(filter_defs[i]);
                    new Filter(this, filter_defs[i]);
                }
            }
            this.reports = info.reports;
        },

        _bind_item: function() {
            var i = 0,
                len,
                reports;

            this._prepare_fields();
            this._prepare_filters();

            len = this.reports.length;
            reports = this.reports;
            this.reports = [];
            for (i = 0; i < len; i++) {
                this.reports.push(this.task.item_by_ID(reports[i]));
            }
            this.init_params();
        },

        can_create: function() {
            return this.task.has_privilege(this, 'can_create');
        },

        can_edit: function() {
            return this.task.has_privilege(this, 'can_edit');
        },

        can_delete: function() {
            return this.task.has_privilege(this, 'can_delete');
        },

        _prepare_fields: function() {
            var i = 0,
                len = this._fields.length,
                field,
                lookup_field,
                lookup_field1;
            for (; i < len; i++) {
                field = this._fields[i];
                if (field.lookup_item && (typeof field.lookup_item === "number")) {
                    field.lookup_item = this.task.item_by_ID(field.lookup_item);
                    if (field.lookup_field && (typeof field.lookup_field === "number")) {
                        lookup_field = field.lookup_item._field_by_ID(field.lookup_field);
                        field.lookup_field = lookup_field.field_name;
                        if (lookup_field.lookup_item && field.lookup_field1) {
                            field.lookup_item1 = lookup_field.lookup_item
                            if (typeof field.lookup_item1 === "number") {
                                field.lookup_item1 = this.task.item_by_ID(field.lookup_item1);
                            }
                            if (typeof field.lookup_field1 === "number") {
                                lookup_field1 = field.lookup_item1._field_by_ID(field.lookup_field1)
                                field.lookup_field1 = lookup_field1.field_name
                            }
                            if (lookup_field1.lookup_item && field.lookup_field2) {
                                field.lookup_item2 = lookup_field1.lookup_item;
                                if (typeof field.lookup_item2 === "number") {
                                    field.lookup_item2 = self.task.item_by_ID(field.lookup_item2);
                                }
                                if (typeof field.lookup_field2 === "number") {
                                    field.lookup_field2 = field.lookup_item2._field_by_ID(field.lookup_field2).field_name;
                                }
                            }

                        }
                    }
                }
                if (field.master_field && (typeof field.master_field === "number")) {
                    field.master_field = this.get_master_field(this._fields, field.master_field);
                }
                if (field.lookup_values && (typeof field.lookup_values === "number")) {
                    field.lookup_values = self.task.lookup_lists[field.lookup_values];
                }

            }
            this.fields = this._fields.slice(0);
            for (i = 0; i < len; i++) {
                field = this.fields[i];
                if (this[field.field_name] === undefined) {
                    this[field.field_name] = field;
                }
            }
        },

        dyn_fields: function(fields) {
            var i,
                j,
                attr,
                val,
                field_type,
                data_type,
                field_def;
            this._fields = [];
            this.fields = [];
            this.field_defs = [];
            for (var i = 0; i < fields.length; i++) {
                field_def = []
                for (var j = 0; j < field_attr.length; j++) {
                    attr = field_attr[j];
                    if (attr.charAt(0) === '_') {
                        attr = attr.substr(1);
                    }
                    if (attr === 'data_type') {
                        attr = 'field_type'
                    }
                    val = fields[i][attr]
                    switch (attr) {
                        case 'ID':
                            val = i + 1;
                            break;
                        case 'field_type':
                            field_type = fields[i]['field_type']
                            val = field_type_names.indexOf(field_type);
                            if (val < 1) {
                                val = 1;
                            }
                            data_type = val;
                            break;
                        case 'field_size':
                            if (data_type === 1 && !val) {
                                val = 99999;
                            }
                            break;
                        case 'lookup_item':
                            if (val) {
                                lookup_item = val;
                                val = val.ID
                            }
                            break;
                    }
                    field_def.push(val);
                }
                this.field_defs.push(field_def);
            }
            for (i = 0; i < this.field_defs.length; i++) {
                new Field(this, this.field_defs[i]);
            }
            this._prepare_fields();
        },

        _prepare_filters: function() {
            var i = 0,
                len,
                field;
            len = this.filters.length;
            for (i = 0; i < len; i++) {
                field = this.filters[i].field;
                if (field.lookup_item && (typeof field.lookup_item === "number")) {
                    field.lookup_item = this.task.item_by_ID(field.lookup_item);
                }
                if (field.lookup_field && (typeof field.lookup_field === "number")) {
                    field.lookup_field = field.lookup_item._field_by_ID(field.lookup_field).field_name;
                }
            }
        },

        ids_to_field_names: function(ids) {
            var i,
                field,
                result = [];
            if (ids && ids.length) {
                for (i = 0; i < ids.length; i++) {
                    field = this._field_by_ID(ids[i]);
                    if (field) {
                        result.push(field.field_name);
                    }
                }
            }
            return result;
        },

        ids_to_item_names: function(ids) {
            var i,
                item,
                result = [];
            if (ids && ids.length) {
                for (i = 0; i < ids.length; i++) {
                    item = this.item_by_ID(ids[i]);
                    if (item) {
                        result.push(item.item_name);
                    }
                }
            }
            return result;
        },

        _process_view_params: function() {
            var i,
                field_name,
                field,
                fields = [],
                order,
                table_options,
                table_fields,
                actions,
                form_template,
                form_options,
                column_width = {};
            if (this._view_params instanceof Array) { // for compatibility with previous versions
                for (i = 0; i < this._view_params.length; i++) {
                    field = this._field_by_ID(this._view_params[i][0]);
                    if (field) {
                        fields.push([field.ID, '']);
                    }
                }
                this._view_params = {0: ['', {}, [], {}, fields]};
            }

            form_template = this._view_params[0][0];
            form_options = this._view_params[0][1];
            actions = this._view_params[0][2];
            table_options = this._view_params[0][3];
            table_fields = this._view_params[0][4];

            fields = []
            for (i = 0; i < table_fields.length; i++) {
                field = this._field_by_ID(table_fields[i][0]);
                if (field) {
                    field_name = field.field_name;
                    fields.push(field_name);
                    if (table_fields[i][1]) {
                        column_width[field_name] = table_fields[i][1];
                    }
                }
            }
            this.view_options.fields = fields;

            form_options.default_order = [];
            if (this._default_order) {
                for (i = 0; i < this._default_order.length; i++) {
                    field = this._field_by_ID(this._default_order[i][0]);
                    if (field) {
                        order = field.field_name;
                        if (this._default_order[i][1]) {
                            order = '-' + order
                        }
                        form_options.default_order.push(order);
                    }
                    else {
                        form_options.default_order = [];
                        break;
                    }
                }
            }
            this._default_order = undefined;

            form_options.view_detail = this.ids_to_item_names(form_options.view_detail);
            form_options.view_detail = form_options.view_detail.length ? form_options.view_detail[0] : undefined;
            form_options.search_field = this.ids_to_field_names(form_options.search_field);
            form_options.search_field = form_options.search_field.length ? form_options.search_field[0] : undefined;
            table_options.column_width = column_width;
            table_options.summary_fields = this.ids_to_field_names(table_options.summary_fields);
            table_options.editable_fields = this.ids_to_field_names(table_options.edit_fields);
            delete table_options.edit_fields;
            if (table_options.editable_fields && table_options.editable_fields.length) {
                table_options.editable = true;
            }
            table_options.sort_fields = this.ids_to_field_names(table_options.sort_fields);
            if (table_options.sort_fields && table_options.sort_fields.length) {
                table_options.sortable = true;
            }

            this.view_options.title = this.item_caption;
            this.view_options = $.extend(this.view_options, form_options);
            this._view_options = $.extend({}, this.view_options);
            this.table_options = $.extend(this.table_options, table_options);
            this._table_options = $.extend({}, this.table_options);
        },

        _process_edit_params: function() {
            var i,
                j,
                k,
                field_name,
                field,
                fields = [],
                tab,
                tabs,
                band,
                bands,
                form_tabs,
                actions,
                form_template,
                form_options,
                input_width;
            if (this._edit_params instanceof Array) { // for compatibility with previous versions
                for (i = 0; i < this._edit_params.length; i++) {
                    field = this._field_by_ID(this._edit_params[i][0]);
                    if (field) {
                        fields.push([field.ID, '']);
                    }
                }
                this._edit_params = { 0: ['', {}, [], [['', [[{}, fields, '']]]]] };
            }

            this.edit_options.fields = [];
            form_template = this._edit_params[0][0];
            form_options = this._edit_params[0][1];
            actions = this._edit_params[0][2];
            form_tabs = this._edit_params[0][3];

            tabs = []
            fields = []
            for (i = 0; i < form_tabs.length; i++) {
                tab = {}
                tab.name = form_tabs[i][0];
                tab.bands = [];
                bands = form_tabs[i][1];
                for (j = 0; j < bands.length; j++) {
                    band = {}
                    band.fields = [];
                    input_width = {}
                    band.options = bands[j][0]
                    band.options.input_width = input_width;
                    fields = bands[j][1]
                    band.name = bands[j][2]
                    for (k = 0; k < fields.length; k++) {
                        field = this._field_by_ID(fields[k][0]);
                        if (field) {
                            field_name = field.field_name;
                            band.fields.push(field_name);
                            if (fields[k][1]) {
                                input_width[field_name] = fields[k][1];
                            }
                        }
                    }
                    tab.bands.push(band);
                }
                tabs.push(tab)
            }
            form_options.edit_details = this.ids_to_item_names(form_options.edit_details);
            this.edit_options.title = this.item_caption;
            this.edit_options = $.extend(this.edit_options, form_options);
            this.edit_options.tabs = tabs;
            this._edit_options = $.extend(true, {}, this.edit_options);
        },

        init_params: function() {
            this._process_view_params();
            this._process_edit_params();
        },

        each: function(callback) {
            var value;

            if (this._active) {
                this.first();
                while (!this.eof()) {
                    value = callback.call(this, this);
                    if (value === false) {
                        break;
                    } else {
                        this.next();
                    }
                }
            }
        },

        each_field: function(callback) {
            var i = 0,
                len = this.fields.length,
                value;
            for (; i < len; i++) {
                value = callback.call(this.fields[i], this.fields[i], i);
                if (value === false) {
                    break;
                }
            }
        },

        each_filter: function(callback) {
            var i = 0,
                len = this.filters.length,
                value;
            for (; i < len; i++) {
                value = callback.call(this.filters[i], this.filters[i], i);
                if (value === false) {
                    break;
                }
            }
        },

        each_detail: function(callback) {
            var i = 0,
                len = this.details.length,
                value;
            for (; i < len; i++) {
                value = callback.call(this.details[i], this.details[i], i);
                if (value === false) {
                    break;
                }
            }
        },

        _field_by_name: function(name) {
            return this.field_by_name(name, this._fields);
        },

        field_by_name: function(name, fields) {
            var i = 0,
                len,
                result;
            if (fields === undefined) {
                fields = this.fields;
            }
            len = fields.length;
            for (; i < len; i++) {
                if (fields[i].field_name === name) {
                    return fields[i];
                }
            }
            return result;
        },

        _field_by_ID: function(ID) {
            return this.field_by_ID(ID, this._fields);
        },

        field_by_ID: function(ID, fields) {
            var i = 0,
                len;
            if (fields === undefined) {
                fields = this.fields;
            }
            len = fields.length;
            for (; i < len; i++) {
                if (fields[i].ID === ID) {
                    return fields[i];
                }
            }
        },

        filter_by_name: function(name) {
            var i = 0,
                len = this.filters.length;
            try {
                return this.filters[name];
            } catch (e) {
                for (; i < len; i++) {
                    if (this.filters[i].filter_name === name) {
                        return this.filters[i];
                    }
                }
            }
        },

        detail_by_name: function(name) {
            var i = 0,
                len = this.details.length;
            try {
                return this.details[name];
            } catch (e) {
                for (; i < len; i++) {
                    if (this.details[i].item_name === name) {
                        return this.details[i];
                    }
                }
            }
        },

        get_dataset: function() {
            var i,
                len,
                result = [];
            if (this.active) {
                len = this._dataset.length;
                for (i = 0; i < len; i++)
                    result.push(this._dataset[i].slice(0, this._record_info_index))
                return result
            }
        },

        set_dataset: function(value) {
            this._dataset = value;
        },

        get_keep_history: function() {
            if (this.master) {
                return this.master._keep_history;
                            }
            else {
                return this._keep_history;
            }
        },

        get_selections: function() {
            return this._selections;
        },

        process_selection_changed: function(value) {
            var added = value[0],
                deleted = value[1];
            if (added && !added.length) {
                added = undefined;
            }
            if (deleted && !deleted.length) {
                deleted = undefined;
            }
            if (this.on_selection_changed && (added || deleted)) {
                this.on_selection_changed.call(this, this, added, deleted)
            }
        },

        set_selections: function(value) {
            var self = this;

            if (!value || !(value instanceof Array)) {
                value = [];
            }
            if (this._selections) {
                this.process_selection_changed([undefined, this._selections.slice(0)]);
            }
            this._selections = value;

            this._selections.add = function() {
                var index = self._selections.indexOf(arguments[0]);
                if (index === -1) {
                    Array.prototype.push.apply(this, arguments);
                    self.process_selection_changed([[arguments[0]], undefined]);
                }
            }
            this._selections.push = function() {
                Array.prototype.push.apply(this, arguments);
                self.process_selection_changed([[arguments[0]], undefined]);
            };
            this._selections.remove = function() {
                var index = self._selections.indexOf(arguments[0]),
                    val,
                    removed = [];
                if (index !== -1) {
                    val = [self._selections[index]];
                    Array.prototype.splice.call(this, index, 1);
                    self.process_selection_changed([undefined, val]);
                }
            };
            this._selections.splice = function() {
                var deleted = self._selections.slice(arguments[0], arguments[0] + arguments[1]);
                Array.prototype.splice.apply(this, arguments);
                self.process_selection_changed([undefined, deleted]);
            };
            this._selections.pop = function() {
                throw 'Item selections do not support pop method';
            };
            this._selections.shift = function() {
                throw 'Item selections do not support shift method';
            }
            this._selections.unshift = function() {
                throw 'Item selections do not support unshift method';
            }

            this.process_selection_changed([this._selections.slice(0), undefined]);
            this.update_controls();
        },

        copy: function(options) {
            if (this.master) {
                throw 'A detail can not be copied.';
            }
            return this._copy(options);
        },

        _copy: function(options) {
            var copyTable,
                i,
                len,
                copy,
                field,
                result,
                defaultOptions = {
                    filters: true,
                    details: true,
                    handlers: true
                };
            result = new Item(this.owner, this.ID, this.item_name,
                this.item_caption, this.visible, this.item_type_id);
            result.master = this.master;
            result.item_type = this.item_type;
            options = $.extend({}, defaultOptions, options);
            result.ID = this.ID;
            result.item_name = this.item_name;
            result.expanded = this.expanded;
            result.field_defs = this.field_defs;
            result.filter_defs = this.filter_defs;
            result._primary_key = this._primary_key
            result._deleted_flag = this._deleted_flag
            result._master_id = this._master_id
            result._master_rec_id = this._master_rec_id
            result._edit_options = this._edit_options;
            result._view_options = this._view_options;
            result._table_options = this._table_options;
            result.prototype_ID = this.prototype_ID;
            result._keep_history = this._keep_history;
            result._view_params = this._view_params;
            result._edit_params = this._edit_params;


            len = result.field_defs.length;
            for (i = 0; i < len; i++) {
                new Field(result, result.field_defs[i]);
            }
            result._prepare_fields();
            if (options.filters) {
                len = result.filter_defs.length;
                for (i = 0; i < len; i++) {
                    new Filter(result, result.filter_defs[i]);
                }
                result._prepare_filters();
            }
            result._events = this._events;
            if (options.handlers) {
                len = this._events.length;
                for (i = 0; i < len; i++) {
                    result[this._events[i][0]] = this._events[i][1];
                }
                for (var name in this) {
                    if (this.hasOwnProperty(name)) {
                        if ((name.substring(0, 3) === "on_") && (typeof this[name] === "function")) {
                            result[name] = this[name];
                        }
                    }
                }
                result.edit_options = $.extend({}, this._edit_options);
                result.view_options = $.extend({}, this._view_options);
                result.table_options = $.extend({}, this._table_options);
            }
            else {
                result.edit_options = $.extend({}, this.task.edit_options);
                result.view_options = $.extend({}, this.task.view_options);
                result.table_options = {};
            }
            if (options.details) {
                this.each_detail(function(detail, i) {
                    copyTable = detail._copy(options);
                    copyTable.owner = result;
                    copyTable.expanded = detail.expanded;
                    copyTable.master = result;
                    copyTable.item_type = detail.item_type;
                    result.details.push(copyTable);
                    result.items.push(copyTable);
                    if (!(copyTable.item_name in result)) {
                        result[copyTable.item_name] = copyTable;
                    }
                    if (!(copyTable.item_name in result.details)) {
                        result.details[copyTable.item_name] = copyTable;
                    }
                });
            }
            return result;
        },

        clone: function(keep_filtered) {
            var result,
                i,
                len,
                field,
                new_field;
            if (keep_filtered === undefined) {
                keep_filtered = true;
            }
            result = new Item(this.owner, this.ID, this.item_name,
                this.item_caption, this.visible, this.item_type_id);
            result.master = this.master;
            result.item_type = this.item_type;
            result.ID = this.ID;
            result.item_name = this.item_name;
            result.expanded = this.expanded;

            result.field_defs = this.field_defs;
            result.filter_defs = this.filter_defs;
            result._primary_key = this._primary_key
            result._deleted_flag = this._deleted_flag
            result._master_id = this._master_id
            result._master_rec_id = this._master_rec_id

            len = result.field_defs.length;
            for (i = 0; i < len; i++) {
                field = new Field(result, result.field_defs[i]);
            }
            result._prepare_fields();

            len = result.fields.length;
            for (i = 0; i < len; i++) {
                field = result.fields[i]
                if (result[field.field_name] !== undefined) {
                    delete result[field.field_name];
                }
            }
            result.fields = []
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                field = this.fields[i];
                new_field = result._field_by_name(field.field_name)
                result.fields.push(new_field)
                if (result[new_field.field_name] === undefined) {
                    result[new_field.field_name] = new_field;
                }
            }

            result.update_system_fields();

            result._bind_fields(result.expanded);
            result._dataset = this._dataset;
            if (keep_filtered) {
                result.on_filter_record = this.on_filter_record;
                result.filtered = this.filtered;
            }
            result._active = true;
            result._set_item_state(consts.STATE_BROWSE);
            result.first();
            return result;
        },

        store_handlers: function() {
            var result = {};
            for (var name in this) {
                if (this.hasOwnProperty(name)) {
                    if ((name.substring(0, 3) === "on_") && (typeof this[name] === "function")) {
                        result[name] = this[name];
                    }
                }
            }
            return result;
        },

        clear_handlers: function() {
            for (var name in this) {
                if (this.hasOwnProperty(name)) {
                    if ((name.substring(0, 3) === "on_") && (typeof this[name] === "function")) {
                        this[name] = undefined;
                    }
                }
            }
        },

        load_handlers: function(handlers) {
            for (var name in handlers) {
                if (handlers.hasOwnProperty(name)) {
                    this[name] = handlers[name];
                }
            }
        },

        _get_log_changes: function() {
            return this._log_changes;
        },

        _set_log_changes: function(value) {
            this._log_changes = value;
        },

        is_modified: function() {
            return this._modified;
        },

        _set_modified: function(value) {
            this._modified = value;
            if (this.master && value) {
                this.master._set_modified(value);
            }
        },

        _bind_fields: function(expanded) {
            var j = 0;
            if (expanded === undefined) {
                expanded = true;
            }
            this.each_field(function(field, i) {
                field.bind_index = null;
                field.lookup_index = null;
            });
            this.each_field(function(field, i) {
                if (!field.master_field) {
                    field.bind_index = j;
                    j += 1;
                }
            });
            this.each_field(function(field, i) {
                if (field.master_field) {
                    field.bind_index = field.master_field.bind_index;
                }
            });
            this._record_lookup_index = j
            if (expanded) {
                this.each_field(function(field, i) {
                    if (field.lookup_item) {
                        field.lookup_index = j;
                        j += 1;
                    }
                });
            }
            this._record_info_index = j;
        },

        set_fields: function(field_list) {
            this._select_field_list = field_list;
        },

        set_order_by: function(fields) {
            this._order_by_list = [];
            if (fields) {
                this._order_by_list = this.get_order_by_list(fields);
            }
        },

        get_order_by_list: function(fields) {
            var field,
                field_name,
                desc,
                fld,
                i,
                len,
                result = [];
            len = fields.length;
            for (i = 0; i < len; i++) {
                field = fields[i];
                field_name = field;
                desc = false;
                if (field[0] === '-') {
                    desc = true;
                    field_name = field.substring(1);
                }
                try {
                    fld = this.field_by_name(field_name);
                } catch (e) {
                    throw this.item_name + ': set_order_by method arument error - ' + field + ' ' + e;
                }
                result.push([fld.ID, desc]);
            }
            return result;
        },

        set_where: function(whereDef) {
            this._where_list = this.get_where_list(whereDef);
        },

        get_where_list: function(whereDef) {
            var field,
                field_name,
                field_arg,
                filter_type,
                filter_str,
                value,
                pos,
                result = [];
            for (field_name in whereDef) {
                if (whereDef.hasOwnProperty(field_name)) {
                    field_arg = field_name
                    value = whereDef[field_name];
                    pos = field_name.indexOf('__');
                    if (pos > -1) {
                        filter_str = field_name.substring(pos + 2);
                        field_name = field_name.substring(0, pos);
                    } else {
                        filter_str = 'eq';
                    }
                    filter_type = filter_value.indexOf(filter_str);
                    if (filter_type !== -1) {
                        filter_type += 1
                    } else {
                        throw this.item_name + ': set_where method arument error - ' + field_arg;
                    }
                    field = this._field_by_name(field_name);
                    if (!field) {
                        throw this.item_name + ': set_where method arument error - ' + field_arg;
                    }
                    if (value !== null) {
                        if (field.data_type === consts.DATETIME && filter_type !== consts.FILTER_ISNULL) {
                            value = field.format_date_to_string(value, '%Y-%m-%d %H:%M:%S')
                        }
                        result.push([field_name, filter_type, value])
                    }
                }
            }
            return result;
        },

        update_system_fields: function() {
            var i,
                len,
                field,
                sys_field,
                sys_field_name,
                sys_fields = ['_primary_key', '_deleted_flag', '_master_id', '_master_rec_id'];
            len = sys_fields.length;
            for (i = 0; i < len; i++) {
                sys_field_name = sys_fields[i];
                sys_field = this[sys_field_name];
                if (sys_field) {
                    field = this.field_by_name(sys_field)
                    if (field) {
                        this[sys_field_name + '_field'] = field;
                    }
                }
            }
        },

        _update_fields: function(fields) {
            var i,
                len,
                field;
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                field = this.fields[i]
                if (this[field.field_name] !== undefined) {
                    delete this[field.field_name];
                }
            }
            this.fields = [];
            if (fields === undefined && this._select_field_list.length) {
                fields = this._select_field_list;
            }
            if (fields) {
                len = fields.length;
                for (i = 0; i < len; i++) {
                    this.fields.push(this._field_by_name(fields[i]));
                }
            } else {
                this.fields = this._fields.slice(0);
            }
            fields = []
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                field = this.fields[i]
                if (this[field.field_name] === undefined) {
                    this[field.field_name] = field;
                }
                fields.push(field.field_name);
            }
            this.update_system_fields();
            return fields
        },

        _do_before_open: function(expanded, fields, where, order_by, open_empty, params,
            offset, limit, funcs, group_by) {
            var filters = [];

            if (this.on_before_open) {
                this.on_before_open.call(this, this, params);
            }

            params.__expanded = expanded;
            params.__fields = [];

            fields = this._update_fields(fields);
            this._select_field_list = [];

            if (fields) {
                params.__fields = fields;
            }

            params.__open_empty = open_empty;
            if (!params.__order) {
                params.__order = []
            }
            if (!open_empty) {
                params.__limit = 0;
                params.__offset = 0;
                if (limit) {
                    params.__limit = limit;
                    if (offset) {
                        params.__offset = offset;
                    }
                }
                if (where) {
                    filters = this.get_where_list(where);
                } else if (this._where_list.length) {
                    filters = this._where_list.slice(0);
                } else {
                    this.each_filter(function(filter, i) {
                        if (filter.get_value() !== null) {
                            filters.push([filter.field.field_name, filter.filter_type, filter.get_value()]);
                        }
                    });
                }
                if (params.__search !== undefined) {
                    var field_name = params.__search[0],
                        text = params.__search[1],
                        filter_type = params.__search[2];
                    filters.push([field_name, filter_type, text]);
                }
                if (this.show_selected) {
                    filters.push([this._primary_key, consts.FILTER_IN, this.selections]);
                }
                params.__filters = filters;
                if (order_by) {
                    params.__order = this.get_order_by_list(order_by);
                } else if (this._order_by_list.length) {
                    params.__order = this._order_by_list.slice(0);
                }
                this._where_list = [];
                this._order_by_list = [];
                if (funcs) {
                    params.__funcs = funcs;
                }
                if (group_by) {
                    params.__group_by = group_by;
                }
            }
            this._open_params = params;
        },

        _do_after_open: function() {
            if (this.on_after_open) {
                this.on_after_open.call(this, this);
            }
            if (this.master) {
                this.master._detail_changed(this);
            }
        },

        open_details: function() {
            var i,
                self = this,
                args = this._check_args(arguments),
                callback = args['function'],
                options = args['object'],
                async = args['boolean'],
                details = this.details,
                detail_count = 0,
                after_open = function() {
                    detail_count -= 1;
                    if (detail_count === 0 && callback) {
                        callback.call(self, self);
                    }
                };

            if (options && options.details) {
                details = options.details;
            }

            if (callback || async) {
                for (i = 0; i < details.length; i++) {
                    if (!details[i].disabled) {
                        detail_count += 1;
                    }
                }
                for (i = 0; i < details.length; i++) {
                    if (!details[i].disabled) {
                        details[i].open(after_open);
                    }
                }
            } else {
                for (i = 0; i < details.length; i++) {
                    if (!details[i].disabled) {
                        details[i].open();
                    }
                }
            }
        },

        find_change_log: function() {
            if (this.master) {
                if (this.master._get_record_status() !== consts.RECORD_UNCHANGED) {
                    return this.master.change_log.get_detail_log(this.ID)
                }
            }
        },

        _check_open_options: function(options) {
            if (options) {
                if (options.fields && !$.isArray(options.fields)) {
                    throw this.item_name + ': open method options error: the fields option must be an array.';
                }
                if (options.order_by && !$.isArray(options.order_by)) {
                    throw this.item_name + ': open method options error: the order_by option must be an array.';
                }
                if (options.group_by && !$.isArray(options.group_by)) {
                    throw this.item_name + ': open method options error: the group_by option must be an array.';
                }
            }
        },

        open: function() {
            var args = this._check_args(arguments),
                callback = args['function'],
                options = args['object'],
                async = args['boolean'],
                expanded,
                fields,
                where,
                order_by,
                open_empty,
                funcs,
                group_by,
                params,
                callback,
                log,
                limit,
                offset,
                field_name,
                rec_info,
                records,
                page_changed = false;
                self = this;
            this._check_open_options(options);
            if (options) {
                expanded = options.expanded;
                fields = options.fields;
                where = options.where;
                order_by = options.order_by;
                open_empty = options.open_empty;
                params = options.params;
                offset = options.offset;
                limit = options.limit;
                funcs = options.funcs;
                group_by = options.group_by;
            }
            if (!params) {
                params = {};
            }
            if (expanded === undefined) {
                expanded = this.expanded;
            } else {
                this.expanded = expanded;
            }
            if (!async) {
                async = callback ? true : false;
            }
            if (this.master) {
                if (!this.disabled && this.master.record_count() > 0) {
                    params.__master_id = this.master.ID;
                    params.__master_rec_id = this.master.field_by_name(this.master._primary_key).value;
                    if (this.master.is_new()) {
                        records = [];
                    } else {
                        log = this.find_change_log();
                        if (log) {
                            records = log['records']
                            fields = log['fields']
                            expanded = log['expanded']
                        }
                    }
                    if (records !== undefined) {
                        this._do_before_open(expanded, fields,
                            where, order_by, open_empty, params, offset,
                            limit, funcs, group_by)
                        this._bind_fields(expanded);
                        if (this.master.is_new()) {
                            this.change_log.prepare();
                        }
                        this._dataset = records;
                        this._active = true;
                        this._set_item_state(consts.STATE_BROWSE);
                        this.first();
                        this._do_after_open();
                        this.update_controls(consts.UPDATE_OPEN);
                        if (callback) {
                            callback.call(this, this);
                        }
                        return;
                    }
                } else {
                    this.close();
                    return;
                }
            }

            if (this._paginate && offset !== undefined) {
                page_changed = true;
                params = this._open_params;
                params.__offset = offset;
                if (this.on_before_open) {
                    this.on_before_open.call(this, this, params);
                }
            } else {
                if (offset === undefined) {
                    offset = 0;
                }
                this._do_before_open(expanded, fields,
                    where, order_by, open_empty, params, offset, limit, funcs, group_by);
                this._bind_fields(expanded);
            }
            if (this._paginate) {
                params.__limit = this._limit;
            }
            this.change_log.prepare();
            this._dataset = [];
            this._do_open(offset, async, params, open_empty, page_changed, callback);
        },

        _do_open: function(offset, async, params, open_empty, page_changed, callback) {
            var self = this,
                data;
            if (this.on_open && !open_empty) {
                if (this.on_open) {
                    this.on_open.call(this, this, params, function(data) {
                        self._do_after_load(data, offset, callback);
                    });
                }
            }
            else if (async && !open_empty) {
                this.send_request('open', params, function(data) {
                    self._do_after_load(data, offset, page_changed, callback);
                });
            } else {
                if (open_empty) {
                    data = [
                        [], ''
                    ];
                } else {
                    data = this.send_request('open', params);
                }
                this._do_after_load(data, offset, page_changed, callback);
            }
        },

        _do_after_load: function(data, offset, page_changed, callback) {
            var rows,
                error_mes,
                i,
                len;
            if (data) {
                error_mes = data[1];
                if (error_mes) {
                    this.alert_error(error_mes)
                } else {
                    if (data[0]) {
                        rows = data[0];

                        len = rows.length;
                        this._dataset = rows;
                        if (this._limit && this._paginate && rows) {
                            this._offset = offset;
                            this.is_loaded = false;
                        }
                        if (len < this._limit) {
                            this.is_loaded = true;
                        }
                        this._active = true;
                        this._set_item_state(consts.STATE_BROWSE);
                        this._cur_row = null;
                        this.first();
                        this._do_after_open();
                        if (!this._paginate || this._paginate && offset === 0) {
                            if (this.on_filters_applied) {
                                this.on_filters_applied.call(this, this);
                            }
                            if (this._on_filters_applied_internal) {
                                this._on_filters_applied_internal.call(this, this);
                            }
                        }
                        if (page_changed) {
                            this.update_controls(consts.UPDATE_PAGE_CHANGED);
                        }
                        else {
                            this.update_controls(consts.UPDATE_OPEN);
                        }
                        if (callback) {
                            callback.call(this, this);
                        }
                    }
                }
            } else {
                this._dataset = [];
                console.log(this.item_name + " error while opening table");
            }
        },

        _do_close: function() {
            this._active = false;
            this._dataset = null;
            this._cur_row = null;
        },

        close: function() {
            var len = this.details.length;
            this.update_controls(consts.UPDATE_CLOSE);
            this._do_close();
            for (var i = 0; i < len; i++) {
                this.details[i].close();
            }
        },

        sort: function(field_list) {
            var list = this.get_order_by_list(field_list)
            this._sort(list);
        },

        _sort: function(sort_fields) {
            var i,
                field_names = [],
                desc = [];
            for (i = 0; i < sort_fields.length; i++) {
                field_names.push(this.field_by_ID(sort_fields[i][0]).field_name);
                desc.push(sort_fields[i][1]);
            }
            this._sort_dataset(field_names, desc);
        },

        _sort_dataset: function(field_names, desc) {
            var self = this,
                i,
                field_name,
                field;

            function convert_value(value, data_type) {
                if (value === null) {
                    if (data_type === consts.TEXT) {
                        value = ''
                    } else if (data_type === consts.INTEGER || data_type === consts.FLOAT || data_type === consts.CURRENCY) {
                        value = 0;
                    } else if (data_type === consts.DATE || data_type === consts.DATETIME) {
                        value = new Date(0);
                    } else if (data_type === consts.BOOLEAN) {
                        value = false;
                    }
                }
                if (data_type === consts.FLOAT) {
                    value = Number(value.toFixed(10));
                }
                if (data_type === consts.CURRENCY) {
                    value = Number(value.toFixed(2));
                }
                return value;
            }

            function compare_records(rec1, rec2) {
                var i,
                    field,
                    data_type,
                    index,
                    result,
                    val1,
                    val2;
                for (var i = 0; i < field_names.length; i++) {
                    field = self.field_by_name(field_names[i]);
                    index = field.bind_index;
                    if (field.lookup_item) {
                        index = field.lookup_index;
                    }
                    data_type = field.get_lookup_data_type();
                    val1 = convert_value(rec1[index], data_type);
                    val2 = convert_value(rec2[index], data_type);
                    if (val1 < val2) {
                        result = -1;
                    }
                    if (val1 > val2) {
                        result = 1;
                    }
                    if (result) {
                        if (desc[i]) {
                            result = -result;
                        }
                        return result;
                    }
                }
                return 0;
            }

            this._dataset.sort(compare_records);
            this.update_controls();
        },

        search: function() {
            var args = this._check_args(arguments),
                callback = args['function'],
                field_name = arguments[0],
                text = arguments[1].trim(),
                field,
                filter,
                filter_type,
                i, j,
                ids,
                substr,
                str,
                found,
                lookup_values,
                params = {};
            if (callback) {
                if (arguments.length === 4) {
                    filter = arguments[2];
                }
            }
            else if (arguments.length === 3) {
                filter = arguments[2];
            }
            if (filter) {
                filter_type = filter_value.indexOf(filter) + 1;
            }
            else {
                filter_type = consts.FILTER_CONTAINS_ALL;
            }
            field = this.field_by_name(field_name);
            if (field) {
                if (field.lookup_values) {
                    lookup_values = this.field_by_name(field_name).lookup_values;
                    ids = [];
                    if (text.length) {
                        for (i = 0; i < lookup_values.length; i++) {
                            str = lookup_values[i][1].toLowerCase();
                            substr = text.toLowerCase().split(' ');
                            found = true;
                            for (j = 0; j < substr.length; j++) {
                                if (substr[j]) {
                                    if (str.indexOf(substr[j]) === -1) {
                                        found = false;
                                        break;
                                    }
                                }
                            }
                            if (found) {
                                ids.push(lookup_values[i][0])
                            }
                        }
                    }
                    if (!ids.length) {
                        ids.push(-1);
                    }
                    text = ids;
                    filter_type = consts.FILTER_IN;
                }
                else if (field.numeric_field() && (
                    filter_type === consts.FILTER_CONTAINS ||
                    filter_type === consts.FILTER_STARTWITH ||
                    filter_type === consts.FILTER_ENDWITH ||
                    filter_type === consts.FILTER_CONTAINS_ALL)) {
                    text = text.replace(locale.DECIMAL_POINT, ".");
                    text = text.replace(locale.MON_DECIMAL_POINT, ".");
                }
                if (text.length) {
                    params.__search = [field_name, text, filter_type];
                    this.open({params: params}, callback);
                } else {
                    this.open(function() {;
                        if (callback) {
                            callback.call(this, this);
                        }
                    });
                }
                return [field_name, text, filter_value[filter_type - 1]];
            }
        },

        total_records: function(callback) {
            var self = this;
            if (this._open_params.__open_empty && callback) {
                return 0;
            } else {
                if (this.on_count) {
                    this.on_count.call(this, this, this._open_params, function(data) {
                        if (data && callback) {
                            callback.call(self, data[0]);
                        }
                    });
                }
                else {
                    this.send_request('total_records', this._open_params, function(data) {
                        if (data && callback) {
                            callback.call(self, data[0]);
                        }
                    });
                }
            }
        },

        new_record: function() {
            var result = [];
            this.each_field(function(field, i) {
                if (!field.master_field) {
                    result.push(null);
                }
            });
            if (this.expanded) {
                this.each_field(function(field, i) {
                    if (field.lookup_item) {
                        result.push(null);
                    }
                });
            }
            return result;
        },

        _do_before_append: function() {
            if (this.on_before_append) {
                this.on_before_append.call(this, this);
            }
        },

        _do_after_append: function() {
            var i = 0,
                len = this.fields.length,
                field;
            for (; i < len; i++) {
                field = this.fields[i];
                if (field.default_value) {
                    try {
                        field.text = field.default_value;
                    }
                    catch (e) {
                    }
                }
            }
            this._modified = false;
            if (this.on_after_append) {
                this.on_after_append.call(this, this);
            }
        },

        append: function() {
            if (!this._active) {
                throw language.append_not_active.replace('%s', this.item_name);
            }
            if (this.master && !this.master.is_changing()) {
                throw language.append_master_not_changing.replace('%s', this.item_name);
            }
            if (this._get_item_state() !== consts.STATE_BROWSE) {
                throw language.append_not_browse.replace('%s', this.item_name);
            }
            this._do_before_append();
            this._do_before_scroll();
            this._old_row = this._get_rec_no();
            this._set_item_state(consts.STATE_INSERT);
            this._dataset.push(this.new_record());
            this._cur_row = this._dataset.length - 1;
            this._set_record_status(consts.RECORD_INSERTED);
            this.update_controls(consts.UPDATE_APPEND);
            this._do_after_scroll();
            this._do_after_append();
        },

        insert: function() {
            if (!this._active) {
                throw language.insert_not_active.replace('%s', this.item_name);
            }
            if (this.master && !this.master.is_changing()) {
                throw language.insert_master_not_changing.replace('%s', this.item_name);
            }
            if (this._get_item_state() !== consts.STATE_BROWSE) {
                throw language.insert_not_browse.replace('%s', this.item_name);
            }
            this._do_before_append();
            this._do_before_scroll();
            this._old_row = this._get_rec_no();
            this._set_item_state(consts.STATE_INSERT);
            this._dataset.splice(0, 0, this.new_record());
            this._cur_row = 0;
            this._modified = false;
            this._set_record_status(consts.RECORD_INSERTED);
            this.update_controls(consts.UPDATE_INSERT);
            this._do_after_scroll();
            this._do_after_append();
        },

        _do_before_edit: function() {
            if (this.on_before_edit) {
                this.on_before_edit.call(this, this);
            }
        },

        _do_after_edit: function() {
            if (this.on_after_edit) {
                this.on_after_edit.call(this, this);
            }
        },

        edit: function() {
            if (!this._active) {
                throw language.edit_not_active.replace('%s', this.item_name);
            }
            if (this.record_count() === 0) {
                throw language.edit_no_records.replace('%s', this.item_name);
            }
            if (this.master && !this.master.is_changing()) {
                throw language.edit_master_not_changing.replace('%s', this.item_name);
            }
            if (this._get_item_state() !== consts.STATE_BROWSE) {
                throw language.edit_not_browse.replace('%s', this.item_name);
            }
            this._do_before_edit();
            this.change_log.log_change();
            this._buffer = this.change_log.store_record_log();
            this._set_item_state(consts.STATE_EDIT);
            this._old_row = this._get_rec_no();
            this._old_status = this._get_record_status();
            this._modified = false;
            this._do_after_edit();
        },

        _do_before_cancel: function() {
            if (this.on_before_cancel) {
                this.on_before_cancel.call(this, this);
            }
        },

        _do_after_cancel: function() {
            if (this.on_after_cancel) {
                this.on_after_cancel.call(this, this);
            }
        },

        cancel: function() {
            var i,
                len,
                modified = this._modified,
                self = this,
                prev_state;
            this._do_before_cancel();
            if (this._get_item_state() === consts.STATE_EDIT) {
                this.change_log.restore_record_log(this._buffer)
                this.update_controls(consts.UPDATE_CANCEL)
                for (var i = 0; i < this.details.length; i++) {
                    this.details[i].update_controls(consts.UPDATE_OPEN);
                }
            } else if (this._get_item_state() === consts.STATE_INSERT) {
                this.change_log.remove_record_log();
                this.update_controls(consts.UPDATE_DELETE);
                this._dataset.splice(this.rec_no, 1);
            } else {
                throw language.cancel_invalid_state.replace('%s', this.item_name);
            }

            prev_state = this._get_item_state();
            this._set_item_state(consts.STATE_BROWSE);
            if (prev_state === consts.STATE_INSERT) {
                this._do_before_scroll();
            }
            this._cur_row = this._old_row;
            if (prev_state === consts.STATE_EDIT) {
                this._set_record_status(this._old_status);
            }
            this._modified = false;
            if (prev_state === consts.STATE_INSERT) {
                this._do_after_scroll();
            }
            this._do_after_cancel();
            if (modified && this.details.length) {
                this.each_detail(function(d) {
                    self._detail_changed(d);
                });
            }
        },

        is_browsing: function() {
            return this._get_item_state() === consts.STATE_BROWSE;
        },

        is_changing: function() {
            return (this._get_item_state() === consts.STATE_INSERT) || (this._get_item_state() === consts.STATE_EDIT);
        },

        is_new: function() {
            return this._get_item_state() === consts.STATE_INSERT;
        },

        is_edited: function() {
            return this._get_item_state() === consts.STATE_EDIT;
        },

        is_deleting: function() {
            return this._get_item_state() === consts.STATE_DELETE;
        },


        _do_before_delete: function(callback) {
            if (this.on_before_delete) {
                this.on_before_delete.call(this, this);
            }
        },

        _do_after_delete: function() {
            if (this.on_after_delete) {
                this.on_after_delete.call(this, this);
            }
        },

        "delete": function() {
            var rec = this._get_rec_no();
            if (!this._active) {
                throw language.delete_not_active.replace('%s', this.item_name);
            }
            if (this.record_count() === 0) {
                throw language.delete_no_records.replace('%s', this.item_name);
            }
            if (this.master && !this.master.is_changing()) {
                throw language.delete_master_not_changing.replace('%s', this.item_name);
            }
            this._set_item_state(consts.STATE_DELETE);
            try {
                this._do_before_delete();
                this._do_before_scroll();
                this.update_controls(consts.UPDATE_DELETE);
                this.change_log.log_change();
                if (this.master) {
                    this.master._set_modified(true);
                }
                this._dataset.splice(rec, 1);
                this._set_rec_no(rec);
                this._set_item_state(consts.STATE_BROWSE);
                this._do_after_scroll();
                this._do_after_delete();
                if (this.master) {
                    this.master._detail_changed(this, true);
                }
            } catch (e) {
                throw e;
            } finally {
                this._set_item_state(consts.STATE_BROWSE);
            }
        },

        detail_by_ID: function(ID) {
            var result;
            if (typeof ID === "string") {
                ID = parseInt(ID, 10);
            }
            this.each_detail(function(detail, i) {
                if (detail.ID === ID) {
                    result = detail;
                    return false;
                }
            });
            return result;
        },

        post: function(callback) {
            var data,
                i,
                len,
                old_state = this._get_item_state(),
                modified = this._modified;

            if (!this.is_changing()) {
                throw this.item_name + ' post method: dataset is not in edit or insert mode';
            }
            if (this.on_before_post) {
                this.on_before_post.call(this, this);
            }
            if (this.master && this._master_id) {
                this.field_by_name(this._master_id).set_data(this.master.ID);
            }
            this.check_record_valid();
            len = this.details.length;
            for (i = 0; i < len; i++) {
                if (this.details[i].is_changing()) {
                    this.details[i].post();
                }
            }
            if (this.is_modified() || this.is_new()) {
                this.change_log.log_change();
            } else if (this._get_record_status() === consts.RECORD_UNCHANGED) {
                this.change_log.remove_record_log();
            }
            this._modified = false;
            this._set_item_state(consts.STATE_BROWSE);
            if (this.on_after_post) {
                this.on_after_post.call(this, this);
            }
            if (!this._valid_record()) {
                this.update_controls(consts.UPDATE_DELETE);
                this._search_record(this._get_rec_no(), 0);
            }
            if (this.master && modified) {
                this.master._detail_changed(this, true);
            }
        },

        apply: function() {
            var args = this._check_args(arguments),
                callback = args['function'],
                params = args['object'],
                async = args['boolean'],
                self = this,
                changes = {},
                result,
                data,
                result = true;
            if (this.master) {
                if (callback) {
                    callback.call(this);
                }
                return;
            }
            if (this.is_changing()) {
                this.post();
            }
            this.change_log.get_changes(changes);
            if (!this.change_log.is_empty_obj(changes.data)) {
                if (this.on_before_apply) {
                    result = this.on_before_apply.call(this, this);
                    if (result) {
                        params = $.extend({}, params, result);
                    }
                }
                if (callback || async) {
                    this.send_request('apply', [changes, params], function(data) {
                        self._process_apply(data, callback);
                    });
                } else {
                    data = this.send_request('apply', [changes, params]);
                    result = this._process_apply(data);
                }
            }
            else if (callback) {
                //~ if (this.on_before_apply) {
                    //~ this.on_before_apply.call(this, this);
                //~ }
                //~ if (this.on_after_apply) {
                    //~ this.on_after_apply.call(this, this);
                //~ }
                if (callback) {
                    callback.call(this);
                }
            }
        },

        _process_apply: function(data, callback) {
            var res,
                err;
            if (data) {
                res = data[0]
                err = data[1]
                if (err) {
                    if (callback) {
                        callback.call(this, err);
                    }
                    throw err;
                } else {
                    this.change_log.update(res)
                    if (this.on_after_apply) {
                        this.on_after_apply.call(this, this);
                    }
                    if (callback) {
                        callback.call(this);
                    }
                    this.update_controls(consts.UPDATE_APPLIED);
                }
            }
        },

        delta: function(changes) {
            var i,
                len,
                field,
                result;
            if (changes === undefined) {
                changes = {}
                this.change_log.get_changes(changes);
            }
            result = this.copy({
                filters: false,
                details: true,
                handlers: false
            });
            result.on_after_scroll = function(result) {
                result.open_details();
            }
            result.expanded = false;
            result._is_delta = true;
            len = result.details.length;
            for (i = 0; i < len; i++) {
                result.details[i].expanded = false;
                result.details[i]._is_delta = true;
            }
            result.change_log.set_changes(changes);
            result._dataset = result.change_log.records;
            result._update_fields(result.change_log.fields);
            result._bind_fields(result.change_log.expanded)
            result._set_item_state(consts.STATE_BROWSE);
            result._cur_row = null;
            result._active = true;
            result.first();
            return result;
        },

        field_by_id: function(id_value, fields, callback) {
            var copy,
                values,
                result;
            if (typeof fields === 'string') {
                fields = [fields];
            }
            copy = this.copy();
            copy.set_where({
                id: id_value
            });
            if (callback) {
                copy.open({
                    expanded: false,
                    fields: fields
                }, function() {
                    values = copy._dataset[0];
                    if (fields.length === 1) {
                        values = values[0];
                    }
                    return values
                });
            } else {
                copy.open({
                    expanded: false,
                    fields: fields
                });
                if (copy.record_count() === 1) {
                    values = copy._dataset[0];
                    if (fields.length === 1) {
                        values = values[0];
                    }
                    return values
                }
            }
        },

        locate: function(fields, values) {
            var clone = this.clone();

            function record_found() {
                var i,
                    len;
                if (fields instanceof Array) {
                    len = fields.length;
                    for (i = 0; i < len; i++) {
                        if (clone.field_by_name(fields[i]).value !== values[i]) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    if (clone.field_by_name(fields).value === values) {
                        return true;
                    }
                }
            }

            clone.first();
            while (!clone.eof()) {
                if (record_found()) {
                    this.rec_no = clone.rec_no;
                    return true;
                }
                clone.next();
            }
        },

        _get_active: function() {
            return this._active;
        },

        _set_read_only: function(value) {
            var i,
                len;
            this._read_only = value;
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                this.fields[i].update_controls();
            }
            this.each_detail(function(detail, i) {
                detail._set_read_only(value);
            });
        },

        _get_read_only: function() {
            if (this.master && this.master.read_only) {
                return true;
            } else {
                return this._read_only;
            }
        },

        _get_filtered: function() {
            return this._filtered;
        },

        _set_filtered: function(value) {
            if (value) {
                if (!this.on_filter_record) {
                    value = false;
                }
            }
            if (this._filtered !== value) {
                this._filtered = value;
                this.first();
                this.update_controls(consts.UPDATE_OPEN);
            }
        },

        clear_filters: function() {
            this.each_filter(function(filter) {
                filter.value = null;
            })
        },

        assign_filters: function(item) {
            var self = this;
            item.each_filter(function(f) {
                if (f.value === null) {
                    self.filter_by_name(f.filter_name).field.value = null;
                } else {
                    self.filter_by_name(f.filter_name).field.value = f.field.value;
                }
            });
        },

        _set_item_state: function(value) {
            if (this._state !== value) {
                this._state = value;
                if (this.on_state_changed) {
                    this.on_state_changed.call(this, this);
                }
                this.update_controls(consts.UPDATE_STATE);
            }
        },

        _get_item_state: function() {
            return this._state;
        },

        _do_after_scroll: function() {
            var len = this.details.length,
                detail;
            for (var i = 0; i < len; i++) {
                this.details[i]._do_close();
            }
            this.update_controls(consts.UPDATE_SCROLLED);
            if (this.on_after_scroll) {
                this.on_after_scroll.call(this, this);
            }
            if (this._on_after_scroll_internal) {
                this._on_after_scroll_internal.call(this, this);
            }
        },

        _do_before_scroll: function() {
            if (this._cur_row !== null) {
                if (this.is_changing()) {
                    this.post();
                }
                if (this.on_before_scroll) {
                    this.on_before_scroll.call(this, this);
                }
                if (this._on_before_scroll_internal) {
                    this._on_before_scroll_internal.call(this, this);
                }
            }
        },

        skip: function(value) {
            var eof,
                bof,
                old_row,
                new_row;
            if (this.record_count() === 0) {
                this._do_before_scroll();
                this._eof = true;
                this._bof = true;
                this._do_after_scroll();
            } else {
                old_row = this._cur_row;
                eof = false;
                bof = false;
                new_row = value;
                if (new_row < 0) {
                    new_row = 0;
                    bof = true;
                }
                if (new_row >= this._dataset.length) {
                    new_row = this._dataset.length - 1;
                    eof = true;
                }
                this._eof = eof;
                this._bof = bof;
                if (old_row !== new_row) {
                    this._do_before_scroll();
                    this._cur_row = new_row;
                    this._do_after_scroll();
                } else if (eof || bof && this.is_new() && this.record_count() === 1) {
                    this._do_before_scroll();
                    this._do_after_scroll();
                }
            }
        },

        _set_rec_no: function(value) {
            if (this._active) {
                if (this.filter_active()) {
                    this._search_record(value, 0);
                } else {
                    this.skip(value);
                }
            }
        },

        _get_rec_no: function() {
            if (this._active) {
                return this._cur_row;
            }
        },

        filter_active: function() {
            if (this.on_filter_record && this.filtered) {
                return true;
            }
        },

        first: function() {
            if (this.filter_active()) {
                this.find_first();
            } else {
                this._set_rec_no(0);
            }
        },

        last: function() {
            if (this.filter_active()) {
                this.find_last();
            } else {
                this._set_rec_no(this._dataset.length);
            }
        },

        next: function() {
            if (this.filter_active()) {
                this.find_next();
            } else {
                this._set_rec_no(this._get_rec_no() + 1);
            }
        },

        prior: function() {
            if (this.filter_active()) {
                this.find_prior();
            } else {
                this._set_rec_no(this._get_rec_no() - 1);
            }
        },

        eof: function() {
            if (this.active) {
                return this._eof;
            }
            else {
                return true;
            }
        },

        bof: function() {
            if (this.active) {
                return this._bof;
            }
            else {
                return true;
            }
        },

        _valid_record: function() {
            if (this.on_filter_record && this.filtered) {
                return this.on_filter_record.call(this, this);
            } else {
                return true;
            }
        },

        _search_record: function(start, direction) {
            var row,
                cur_row,
                self = this;
            if (direction === undefined) {
                direction = 1;
            }

            function update_position() {
                if (self.record_count() === 0) {
                    self._eof = true;
                    self._bof = true;
                } else {
                    self._eof = false;
                    self._bof = false;
                    if (self._cur_row < 0) {
                        self._cur_row = 0;
                        self._bof = true;
                    }
                    if (self._cur_row >= self._dataset.length) {
                        self._cur_row = self._dataset.length - 1;
                        self._eof = true;
                    }
                }
            }

            function check_record() {
                if (direction === 1) {
                    return self.eof();
                } else {
                    return self.bof();
                }
            }

            if (this.active) {
                if (this.record_count() === 0) {
                    this.skip(start);
                    return;
                }
                cur_row = this._cur_row;
                this._cur_row = start + direction;
                update_position();
                if (direction === 0) {
                    if (this._valid_record()) {
                        this._cur_row = cur_row;
                        this.skip(start);
                        return
                    }
                    direction = 1;
                }
                while (!check_record()) {
                    if (this._valid_record()) {
                        if (start !== this._cur_row) {
                            row = this._cur_row;
                            this._cur_row = start;
                            this.skip(row);
                            return
                        }
                    } else {
                        this._cur_row = this._cur_row + direction;
                        update_position();
                    }
                }
            }
        },

        find_first: function() {
            this._search_record(-1, 1);
        },

        find_last: function() {
            this._search_record(this._dataset.length, -1);
        },

        find_next: function() {
            this._search_record(this._get_rec_no(), 1);
        },

        find_prior: function() {
            this._search_record(this._get_rec_no(), -1);
        },

        _count_filtered: function() {
            var clone = this.clone(true),
                result = 0;
            clone.each(function() {
                result += 1;
            })
            return result;
        },

        get_rec_count: function() {
            if (this._dataset) {
                if (this.filtered) {
                    return this._count_filtered();
                }
                else {
                    return this._dataset.length;
                }
            } else {
                return 0;
            }
        },

        record_count: function() {
            if (this._dataset) {
                return this._dataset.length;
            } else {
                return 0;
            }
        },

        find_rec_info: function(rec_no, record) {
            if (record === undefined) {
                if (rec_no === undefined) {
                    rec_no = this._get_rec_no();
                    if (this.record_count() > 0) {
                        record = this._dataset[rec_no];
                    }
                }
            }
            if (record && (this._record_info_index > 0)) {
                if (record.length < this._record_info_index + 1) {
                    record.push([null, {},
                        null
                    ]);
                }
                return record[this._record_info_index];
            }
        },

        get_rec_info: function(rec_no, record) {
            return this.find_rec_info(rec_no, record);
        },

        _get_record_status: function() {
            var info = this.get_rec_info();
            if (info) {
                return info[consts.REC_STATUS];
            }
        },

        _set_record_status: function(value) {
            var info = this.get_rec_info();
            if (info && this.log_changes) {
                info[consts.REC_STATUS] = value;
            }
        },

        rec_controls_info: function() {
            var info = this.get_rec_info();
            if (info) {
                return info[consts.REC_CONTROLS_INFO];
            }
        },

        _get_rec_change_id: function() {
            var info = this.get_rec_info();
            if (info) {
                return info[consts.REC_CHANGE_ID];
            }
        },

        _set_rec_change_id: function(value) {
            var info = this.get_rec_info();
            if (info) {
                info[consts.REC_CHANGE_ID] = value;
            }
        },

        rec_unchanged: function() {
            return this._get_record_status() === consts.RECORD_UNCHANGED;
        },

        rec_inserted: function() {
            return this._get_record_status() === consts.RECORD_INSERTED;
        },

        rec_deleted: function() {
            return this._get_record_status() === consts.RECORD_DELETED;
        },

        rec_modified: function() {
            return this._get_record_status() === consts.RECORD_MODIFIED ||
                this._get_record_status() === consts.RECORD_DETAILS_MODIFIED;
        },

    // Item interface methods

        insert_record: function(container, tab_name) {
            container = this._check_container(container);
            if (container && this.task.can_add_tab(container) && $('.modal').length === 0) {
                this._append_record_in_tab(container, tab_name);
            }
            else {
                this._insert_record();
            }
        },

        _insert_record: function(container) {
            if (this.can_create()) {
                if (!this.is_changing()) {
                    this.insert();
                }
                this.create_edit_form(container);
            }
        },

        append_record: function(container, tab_name) {
            if (container && this.task.can_add_tab(container) && $('.modal').length === 0) {
                this._append_record_in_tab(container, tab_name);
            }
            else {
                this._append_record();
            }
        },

        _append_record: function(container) {
            if (this.can_create()) {
                if (!this.is_changing()) {
                    this.append();
                }
                this.create_edit_form(container);
            }
        },

        _append_record_in_tab: function(container, tab_name) {
            var tab_id = this.item_name + 0,
                tab,
                self = this,
                copy = this.copy(),
                content;
            container = this._check_container(container);
            if (this.can_create()) {
                if (!tab_name) {
                    tab_name = '<i class="icon-plus-sign"></i> ' + this.item_caption;
                }
                content = task.add_tab(container, tab_name,
                    {
                        tab_id: tab_id,
                        show_close_btn: true,
                        set_active: true,
                        on_close: function() {
                            task.show_tab(container, tab_id);
                            copy.close_edit_form();
                        }
                    });
                if (content) {
                    copy._tab_info = {container: container, tab_id: tab_id}
                    copy.open({open_empty: true}, function() {
                        var on_after_apply = copy.on_after_apply;
                        copy.edit_options.tab_id = tab_id;
                        copy._append_record(content);
                        copy.on_after_apply = function(item) {
                            if (on_after_apply) {
                                on_after_apply(copy, copy);
                            }
                            self.refresh_page(true);
                        }
                    });
                }
            }
        },

        _check_container: function(container) {
            if (container && container.length) {
                return container;
            }
            else if (!container && this.edit_options.modeless &&
                this.task.forms_in_tabs && this.task.forms_container) {
                return this.task.forms_container;
            }
        },

        edit_record: function(container, tab_name) {
            container = this._check_container(container);
            if (this.rec_count) {
                if ($('.modal').length === 0 && container && this.task.can_add_tab(container)) {
                    this._edit_record_in_tab(container, tab_name)
                }
                else {
                    this._edit_record()
                }
            }
        },

        _edit_record: function(container) {
            if (!this.is_changing()) {
                this.edit();
            }
            if (!this.read_only) {
                this.read_only = !this.can_edit();
            }
            this.create_edit_form(container);
        },

        _edit_record_in_tab: function(container, tab_name) {
            var pk = this._primary_key,
                pk_value = this.field_by_name(pk).value,
                where = {},
                tab_id = this.item_name + pk_value,
                tab,
                self = this,
                copy = this.copy(),
                content;
            if (this.can_edit()) {
                if (!tab_name) {
                    tab_name = '<i class="icon-edit"></i> ' + this.item_caption;
                }
                content = task.add_tab(container, tab_name,
                {
                    tab_id: tab_id,
                    show_close_btn: true,
                    set_active: true,
                    on_close: function() {
                        task.show_tab(container, tab_id);
                        copy.close_edit_form();
                    }
                });
                if (content) {
                    copy._tab_info = {container: container, tab_id: tab_id}
                    where[pk] = pk_value;
                    copy.set_where(where);
                    copy.open(function() {
                        var on_after_apply = copy.on_after_apply;
                        copy.edit_options.tab_id = tab_id;
                        copy._edit_record(content);
                        copy.on_after_apply = function(item) {
                            if (on_after_apply) {
                                on_after_apply(copy, copy);
                            }
                            self.refresh_page(true);
                        }
                    });
                }
            }
        },

        _update_tab_copy: function(copy, container, tab_id) {
            var self = this,
                on_after_apply = copy.on_after_apply;
            copy.on_after_apply = function(item) {
                if (on_after_apply) {
                    on_after_apply(copy, copy);
                }
                self.refresh_page(true);
            }
        },

        cancel_edit: function() {
            if (this.is_changing()) {
                this.cancel();
            }
            this.close_edit_form();
        },

        delete_record: function() {
            var self = this,
                rec_no = self.rec_no,
                record = self._dataset[rec_no],
                args = this._check_args(arguments),
                callback = args['function'],
                refresh_page = args['boolean'];
            if (refresh_page === undefined) {
                refresh_page = true;
            }
            if (!this.paginate) {
                refresh_page = false;
            }
            if (this.can_delete()) {
                if (this.rec_count > 0) {
                    this.question(language.delete_record, function() {
                        self["delete"]();
                        self.apply(function(e) {
                            var error;
                            if (e) {
                                error = (e + '').toUpperCase();
                                if (error && (error.indexOf('FOREIGN KEY') !== -1 ||
                                    error.indexOf('INTEGRITY CONSTRAINT') !== -1 ||
                                    error.indexOf('REFERENCE CONSTRAINT') !== -1
                                    )
                                ) {
                                    self.alert_error(language.cant_delete_used_record);
                                    //~ self.warning(language.cant_delete_used_record);
                                } else {
                                    self.warning(e);
                                }
                                self.refresh_page(true);
                            }
                            else {
                                if (callback) {
                                    callback.call(this, this);
                                }
                                else if (refresh_page) {
                                    self.refresh_page(true);
                                }
                            }
                        });
                    });
                } else {
                    this.warning(language.no_record);
                }
            }
        },

        check_record_valid: function() {
            var error;
            this.each_field(function(field, j) {
                try {
                    field.check_valid();
                } catch (e) {
                    field.update_control_state(e);
                    if (!error) {
                        error = 'Field "' + field.field_name + '": ' + e;
                    }
                }
            });
            if (error) {
                throw error;
            }
        },

        check_filters_valid: function() {
            var error;
            this.each_filter(function(filter, j) {
                try {
                    filter.check_valid();
                } catch (e) {
                    filter.field.update_control_state(e);
                    if (filter.field1) {
                        filter.field1.update_control_state(e);
                    }
                    if (!error) {
                        error = e;
                    }
                }
            });
            if (error) {
                throw error;
            }
        },

        post_record: function() {
            this.post();
            this.close_edit_form();
        },

        apply_record: function() {
            var args = this._check_args(arguments),
                callback = args['function'],
                params = args['object'],
                self = this;
            if (this.is_changing()) {
                this._disable_form(this.edit_form);
                try {
                    this.post();
                    this.apply(params, function(error) {
                        if (error) {
                            self.warning(error);
                            this._enable_form(this.edit_form);
                            if (!self.is_changing()) {
                                self.edit();
                            }
                        }
                        else {
                            if (callback) {
                                callback.call(self, self);
                            }
                            self.close_edit_form();
                        }
                    });
                }
                catch (e) {
                    if (this.edit_form._form_disabled) {
                        this._enable_form(this.edit_form);
                    }
                }
            }
            else {
                this.close_edit_form();
            }
        },

        _do_on_view_keyup: function(e) {
            if (this.task.on_view_form_keyup) {
                this.task.on_view_form_keyup.call(this, this, e);
            }
            if (this.owner.on_view_form_keyup) {
                this.owner.on_view_form_keyup.call(this, this, e);
            }
            if (this.on_view_form_keyup) {
                this.on_view_form_keyup.call(this, this, e);
            }
        },

        _do_on_view_keydown: function(e) {
            if (this.task.on_view_form_keydown) {
                this.task.on_view_form_keydown.call(this, this, e);
            }
            if (this.owner.on_view_form_keydown) {
                this.owner.on_view_form_keydown.call(this, this, e);
            }
            if (this.on_view_form_keydown) {
                this.on_view_form_keydown.call(this, this, e);
            }
        },


        view_modal: function(container) { // depricated
            this.is_lookup_item = true;
            this.view(container);
        },

        view: function(container, options) {
            this.show_selected = false;
            if (container && this.task.can_add_tab(container)) {
                this._view_in_tab(container, options);
            }
            else {
                this._view(container);
            }
        },

        _view: function(container) {
            var self = this;
            this.load_modules([this, this.owner], function() {
                if (!self._order_by_list.length && self.view_options.default_order) {
                    self.set_order_by(self.view_options.default_order);
                }
                self.create_view_form(container);
                if (self.view_options.enable_search) {
                    self.init_search();
                }
                if (self.view_options.enable_filters) {
                    self.init_filters();
                }
            })
        },

        _view_in_tab: function(container, options) {
            var self = this,
                tab_id = this.item_name,
                content,
                default_options = {
                    tab_id: undefined,
                    caption: this.item_caption,
                    show_close_btn: true
                };

            options = $.extend({}, default_options, options);
            if (options.tab_id) {
                tab_id = tab_id + '_' + options.tab_id;
            }
            content = this.task.add_tab(container, options.caption,
            {
                tab_id: tab_id,
                show_close_btn: options.show_close_btn,
                set_active: true,
                on_close: function() {
                    task.show_tab(container, tab_id);
                    self.close_view_form();
                }
            });
            if (content) {
                this._tab_info = {container: container, tab_id: tab_id}
                this._view(content);
            }
        },

        create_view_form: function(container) {
            this._create_form('view', container);
        },

        close_view_form: function() {
            this._close_form('view');
        },

        create_edit_form: function(container) {
            this._create_form('edit', container);
        },

        close_edit_form: function() {
            this._close_form('edit');
        },

        create_filter_form: function(container) {
            this._create_form('filter', container);
        },

        close_filter_form: function() {
            this._close_form('filter');
        },

        apply_filters: function(search_params) {
            var self = this,
                params = {},
                search_field,
                search_value,
                search_type;
            try {
                if (this.on_filters_apply) {
                    this.on_filters_apply.call(this, this);
                }
                this.check_filters_valid();
                try {
                    if (search_params) {
                        search_field = search_params[0];
                        search_value = search_params[1];
                        search_type = search_params[2];
                        search_type = filter_value.indexOf(search_type) + 1;
                        if (search_value) {
                            params.__search = [search_field, search_value, search_type];
                        }
                    }
                }
                catch (e) {
                    params = {};
                }
                this.open({params: params}, function() {
                    self.close_filter_form();
                });
            }
            catch (e) {
            }
        },

        get_filter_text: function() {
            var result = '';
            this.each_filter(function(filter) {
                if (filter.text) {
                    result += ' ' + filter.text;
                }
            });
            if (result && task.old_forms) {
                result = language.filter + ' -' + result;
            }
            return result;
        },

        close_filter: function() { // depricated
            this.close_filter_form();
        },

        disable_controls: function() {
            this._disabled_count += 1;
        },

        enable_controls: function() {
            this._disabled_count -= 1;
            if (this.controls_enabled()) {
                this.update_controls(consts.UPDATE_SCROLLED);
            }
        },

        controls_enabled: function() {
            return this._disabled_count === 0;
        },

        controls_disabled: function() {
            return !this.controls_enabled();
        },

        update_controls: function(state) {
            var i = 0,
                len = this.fields.length;
            if (state === undefined) {
                state = consts.UPDATE_CONTROLS;
            }
            if (this.controls_enabled()) {
                for (i = 0; i < len; i++) {
                    this.fields[i].update_controls(state, true);
                }
                len = this.controls.length;
                if (this.on_update_controls) {
                    this.on_update_controls.call(this, this);
                }
                for (i = 0; i < len; i++) {
                    this.controls[i].update(state);
                }
            }
        },

        create_detail_table: function(container, options) {
            var self = this,
                detail = this.find(this.view_options.view_detail),
                after_scroll = this.on_after_scroll,
                scroll_timeout;
            if (detail && container && container.length) {
                options.editable = false;
                options.multiselect = false;
                detail.create_table(container, options);
                this._on_after_scroll_internal = function() {
                    if (self.view_form.length) {
                        clearTimeout(scroll_timeout);
                        scroll_timeout = setTimeout(
                            function() {
                                detail.set_order_by(detail.view_options.default_order);
                                detail.open(true);
                            },
                            100
                        );
                    }
                }
            }
        },

        create_detail_views: function(container, options) {
            var self = this,
                i,
                detail,
                detail_container,
                details_to_open = [],
                details;

            if (!container.length) {
                return;
            }

            if (options) {
                details = options.details
            }
            if (!details) {
                details = this.edit_options.edit_details;
            }

            if (details.length) {
                if (details.length > 1) {
                    this.task.init_tabs(container)
                }
                for (i = 0; i < details.length; i++) {
                    detail = this.find(details[i]);
                    detail_container = container;
                    if (details.length > 1) {
                        detail_container = task.add_tab(container, detail.item_caption);
                    }
                    detail.view_options.form_header = false;
                    detail.view_options.form_border = false;
                    detail.view(detail_container);
                    if (!detail.active) {
                        details_to_open.push(detail)
                    }
                }
                if (details_to_open.length) {
                    this._disable_form(this.edit_form);
                    this.open_details({details: details_to_open}, function() {
                        try {
                        }
                        finally {
                            self._enable_form(this.edit_form);
                        }
                    });
                }
            }
        },

        add_button: function(container, text, options) {
            var default_options = {
                    id: undefined,
                    'class': undefined,
                    image: undefined,
                    type: undefined,
                    pull_left: false,
                    shortcut: undefined
                },
                result;
            if (!container.length) {
                return;
            }
            options = $.extend({}, default_options, options);
            if (!text) {
                text = 'Button';
            }
            result = $('<button class="btn expanded-btn" type="button"></button>')
            if (options.id) {
                result.attr('id', options.id);
            }
            if (options['class']) {
                result.addClass(options['class']);
            }
            if (options.pull_left) {
                result.addClass('pull-left');
            }
            if (options.type) {
                result.addClass('btn-' + options.type);
            }
            if (options.image && options.shortcut) {
                result.html('<i class="' + options.image + '"></i> ' + text + '<small class="muted">&nbsp;[' + options.shortcut + ']</small>')
            }
            else if (options.image) {
                result.html('<i class="' + options.image + '"></i> ' + text)
            }
            else if (options.shortcut) {
                result.html(' ' + text + '<small class="muted">&nbsp;[' + options.shortcut + ']</small>')
            }
            else {
                result.html(' ' + text)
            }
            container.append(result)
            return result;
        },

        select_records: function(source, fields) {
            var self = this,
                source = source.copy()
            source.selections = [];
            source.on_view_form_close_query = function() {
                var copy = source.copy(),
                    pk_in = copy._primary_key + '__in',
                    where = {};
                if (source.selections.length) {
                    where[pk_in] = source.selections;
                    copy.set_where(where);
                    copy.open(function() {
                        var field,
                            pk_field1,
                            pk_field2,
                            rec_no = self.rec_no;
                        for (var f in fields) {
                            field = self.field_by_name(f);
                            if (field) {
                                if (field.lookup_item && !field.master_field && field.lookup_item.ID === source.ID) {
                                    pk_field1 = field;
                                    pk_field2 = copy.field_by_name(fields[f]);
                                }
                            }
                            else {
                                throw this.item_name + ' - select_records method argument error: ' + f;
                            }
                        }
                        self.disable_controls();
                        try {
                            copy.each(function(c){
                                var field1,
                                    field2;
                                self.append();
                                pk_field1.value = c._primary_key_field.value;
                                pk_field1.lookup_value = pk_field2.display_text;
                                for (var f in fields) {
                                    field1 = self.field_by_name(f);
                                    field2 = c.field_by_name(fields[f]);
                                    if (field1 !== pk_field1) {
                                        if (field1.lookup_item && field1.master_field && field1.lookup_item.ID === source.ID) {
                                            if (field2) {
                                                field1.lookup_value = field2.display_text;
                                            }
                                        }
                                        else {
                                            if (field2) {
                                                field1.value = field2.value;
                                            }
                                            else {
                                                field1.value = fields[f];
                                            }
                                        }
                                    }
                                }
                                self.post();
                            });
                        }
                        catch (e) {
                            console.error(e);
                        }
                        finally {
                            if (rec_no === null) {
                                self.first();
                            }
                            else {
                                self.rec_no = rec_no;
                            }
                            self.enable_controls();
                            self.update_controls();
                        }
                    })
                }
            }
            source.view();
        },

        _detail_changed: function(detail, modified) {
            if (modified && !detail.paginate && this.on_detail_changed ||
                detail.controls.length && detail.table_options.summary_fields.length) {
                var self = this;
                clearTimeout(this._detail_changed_time_out);
                this._detail_changed_time_out = setTimeout(
                    function() {
                        detail._summary = undefined;
                        if (modified && self.on_detail_changed) {
                            self.on_detail_changed.call(self, self, detail);
                        }
                        if (detail._summary === undefined) {
                            self.calc_summary(detail);
                        }
                    },
                    100
                );
            }
        },

        calc_summary: function(detail, fields, callback) {
            var i,
                clone,
                summary_fields = detail.table_options.summary_fields,
                obj,
                field_name,
                field,
                func,
                master_field_name,
                master_field,
                value,
                text,
                sums = [];
            detail._summary = {};
            clone = detail.clone();
            if (this.on_detail_changed) {
                if (fields instanceof Array && fields.length) {
                    for (i = 0; i < fields.length; i++) {
                        master_field_name = Object.keys(fields[i])[0];
                        obj = fields[i][master_field_name];
                        field = undefined;
                        if (typeof obj === 'function') {
                            func = obj;
                        }
                        else {
                            field = clone.field_by_name(obj);
                        }
                        master_field = this.field_by_name(master_field_name);
                        sums.push({sum: 0, field: field, func: func, master_field: master_field});
                    }
                }
            }
            if (detail.controls.length && summary_fields.length) {
                for (i = 0; i < summary_fields.length; i++) {
                    field_name = summary_fields[i];
                    field = clone.field_by_name(field_name);
                    if (field) {
                        sums.push({sum: 0, field: field, field_name: field_name});
                    }
                }
            }
            if (sums.length) {
                clone.each(function(c) {
                    for (i = 0; i < sums.length; i++) {
                        if (sums[i].field) {
                            if (sums[i].field.numeric_field()) {
                                sums[i].sum += sums[i].field.value;
                            }
                            else {
                                sums[i].sum += 1;
                            }
                        }
                        else if (sums[i].func) {
                            sums[i].sum += sums[i].func(c);
                        }
                    }
                });
                for (i = 0; i < sums.length; i++) {
                    master_field = sums[i].master_field;
                    if (master_field && this.is_changing()) {
                        value = sums[i].sum;
                        if (master_field.value !== value) {
                            master_field.value = value;
                        }
                    }
                    else {
                        field_name = sums[i].field_name;
                        field = sums[i].field;
                        value = sums[i].sum;
                        if (field_name) {
                            text = value + '';
                            if (field.data_type === consts.CURRENCY) {
                                text = field.cur_to_str(value)
                            }
                            else if (field.data_type === consts.FLOAT) {
                                text = field.float_to_str(value)
                            }
                            detail._summary[field_name] = text;
                        }
                    }
                }
                if (!$.isEmptyObject(detail._summary)) {
                    detail.update_controls(consts.UPDATE_SUMMARY);
                }
                if (callback) {
                    callback.call(this, this);
                }
            }
        },

        create_table: function(container, options) {
            return new DBTable(this, container, options);
        },

        create_tree: function(container, parent_field, text_field, parent_of_root_value, options) {
            return new DBTree(this, container, parent_field, text_field, parent_of_root_value, options);
        },

        create_bands: function(tab, container) {
            var i,
                j,
                band,
                field,
                fields,
                div,
                options;
            for (i = 0; i < tab.bands.length; i++) {
                fields = tab.bands[i].fields
                if (fields.length) {
                    options = tab.bands[i].options;
                    options.fields = fields;
                    div = $('<div>')
                    container.append(div)
                    this.create_inputs(div, options);
                }
            }
        },

        create_tabs: function(container) {
            var i,
                tabs = this.edit_options.tabs;
            this.task.init_tabs(container);
            for (i = 0; i < tabs.length; i++) {
                this.create_bands(tabs[i], task.add_tab(container, tabs[i].name))
            }
        },

        create_controls: function(container) {
            var tabs = this.edit_options.tabs;
            container.empty();
            if (tabs.length > 1 || tabs.length === 1 && tabs[0].name) {
                this.create_tabs(container);
            }
            else {
                this.create_bands(tabs[0], container);
            }
        },

        create_inputs: function(container, options) {
            var default_options,
                i, len, col,
                field,
                fields = [],
                visible_fields = [],
                cols = [],
                tabindex,
                form,
                tabs;

            if (!container.length) {
                return;
            }

            default_options = {
                fields: [],
                col_count: 1,
                label_on_top: false,
                label_width: undefined,
                label_size: 3,
                row_count: undefined,
                autocomplete: false,
                in_well: true,
                tabindex: undefined
            };

            if (options && options.fields && options.fields.length) {
                visible_fields = options.fields
            } else {
                visible_fields = this.edit_options.fields;
            }
            if (visible_fields.length == 0) {
                tabs = this.edit_options.tabs;
                if (tabs) {
                    if (tabs.length === 1 && !tabs[0].name && tabs[0].bands.length === 1) {
                        visible_fields = tabs[0].bands[0].fields;
                        default_options = $.extend({}, default_options, tabs[0].bands[0].options);
                    }
                    else {
                        this.create_controls(container);
                        return;
                    }
                }
                else {
                    this.each_field(function(f) {
                        if (f.field_name !== f.owner._primary_key && f.field_name !== f.owner._deleted_flag) {
                            visible_fields.push(f.field_name);
                        }
                    });
                }
            }
            len = visible_fields.length;
            for (i = 0; i < len; i++) {
                field = this.field_by_name(visible_fields[i]);
                if (field) {
                    fields.push(field);
                } else {
                    console.error(this.item_name + ' create_entries: there is not a field with field_name - "' + visible_fields[i] + '"');
                }
            }

            options = $.extend({}, default_options, options);

            container.empty();

            form = $('<form class="row-fluid" autocomplete="off"></form>').appendTo(container);
            if (options.in_well) {
                form.addClass('well');
            }
            if (options.autocomplete) {
                form.attr("autocomplete", "on")
            }
            else {
                form.attr("autocomplete", "off")
            }
            if (!options.label_on_top) {
                form.addClass("form-horizontal");
            }
            len = fields.length;
            for (col = 0; col < options.col_count; col++) {
                cols.push($("<div></div>").addClass("span" + 12 / options.col_count).appendTo(form));
            }
            tabindex = options.tabindex;
            //~ if (!tabindex && this.edit_form) {
                //~ tabindex = this.edit_form.tabindex;
                //~ this.edit_form.tabindex += len;
            //~ }
            if (!options.row_count) {
                options.row_count = Math.ceil(len / options.col_count);
            }
            for (i = 0; i < len; i++) {
                new DBInput(fields[i], i + tabindex,
                    cols[Math.floor(i / options.row_count)], options);
            }
        },

        create_filter_inputs: function(container, options) {
            var default_options,
                i, len, col,
                filter,
                filters = [],
                cols = [],
                tabindex,
                form;

            if (!container.length) {
                return;
            }

            default_options = {
                    filters: [],
                    col_count: 1,
                    label_on_top: false,
                    label_width: undefined,
                    autocomplete: false,
                    in_well: true,
                    tabindex: undefined
            };

            options = $.extend({}, default_options, options);

            if (options.filters.length) {
                len = options.filters.length;
                for (i = 0; i < len; i++) {
                    filters.push(this.filter_by_name(options.filters[i]));
                }
            } else {
                this.each_filter(function(filter, i) {
                    if (filter.visible) {
                        filters.push(filter);
                    }
                });
            }
            container.empty();
            form = $('<form form class="row-fluid" autocomplete="off"></form>').appendTo($("<div></div>").addClass("row-fluid").appendTo(container));
            if (options.in_well) {
                form.addClass('well');
            }
            if (options.autocomplete) {
                form.attr("autocomplete", "on")
            }
            if (!options.label_on_top) {
                form.addClass("form-horizontal");
            }
            len = filters.length;
            for (col = 0; col < options.col_count; col++) {
                cols.push($("<div></div>").addClass("span" + 12 / options.col_count).appendTo(form));
            }
            tabindex = options.tabindex;
            if (!tabindex && this.filter_form) {
                tabindex = this.filter_form.tabindex;
                this.filter_form.tabindex += len;
            }
            for (i = 0; i < len; i++) {
                filter = filters[i];
                if (filter.filter_type === consts.FILTER_RANGE) {
                    new DBInput(filter.field, i + 1, cols[Math.floor(i % options.col_count)],
                        options, filter.filter_caption + ' ' + language.range_from);
                    new DBInput(filter.field1, i + 1, cols[Math.floor(i % options.col_count)],
                        options, filter.filter_caption + ' ' + language.range_to);
                }
                else {
                    new DBInput(filter.field, i + 1, cols[Math.floor(i % options.col_count)],
                        options, filter.filter_caption);
                }
            }
        },

         _find_lookup_value: function(field, lookup_field) {
            if (lookup_field.field_kind === consts.ITEM_FIELD) {
                if (field.lookup_field && field.lookup_field1) {
                    if (field.owner.ID === lookup_field.lookup_item.ID &&
                        field.lookup_item.ID === lookup_field.lookup_item1.ID &&
                        field.lookup_field === lookup_field.lookup_field1 &&
                        field.lookup_item1.ID === lookup_field.lookup_item2.ID &&
                        field.lookup_field1 === lookup_field.lookup_field2) {
                        return field.lookup_value;
                    }
                }
                else if (field.lookup_field) {
                    if (field.field_name === lookup_field.lookup_field &&
                        field.owner.ID === lookup_field.lookup_item.ID &&
                        field.lookup_field === lookup_field.lookup_field1 &&
                        field.lookup_item.ID === lookup_field.lookup_item1.ID) {
                        return field.lookup_value;
                    }
                }
                else if (field.field_name === lookup_field.lookup_field &&
                    field.owner.ID === lookup_field.lookup_item.ID) {
                    return field.lookup_value;
                }
            }
            else  if (field.field_name === lookup_field.lookup_field) {
                return field.lookup_value;
            }
        },

        set_lookup_field_value: function() {
            if (this.record_count()) {
                var lookup_field = this.lookup_field,
                    item_field = this.field_by_name(lookup_field.lookup_field),
                    lookup_value = null,
                    item = this.lookup_field.owner,
                    ids = [],
                    slave_field_values = {},
                    self = this;

                if (item_field) {
                    lookup_value = this._find_lookup_value(item_field, lookup_field);
                }
                if (lookup_field.owner && lookup_field.owner.is_changing && !lookup_field.owner.is_changing()) {
                    lookup_field.owner.edit();
                }
                if (this.lookup_field.data_type === consts.KEYS) {
                    this.selections = [this._primary_key_field.value];
                }
                else if (lookup_field.multi_select) {
                    lookup_field.set_value([this._primary_key_field.value], lookup_value);
                } else {
                    if (item) {
                        item.each_field(function(item_field) {
                            if (item_field.master_field === lookup_field) {
                                self.each_field(function(field) {
                                    var lookup_value
                                    if (field.lookup_value) {
                                        lookup_value = self._find_lookup_value(field, item_field);
                                        if (lookup_value) {
                                            slave_field_values[item_field.field_name] = lookup_value;
                                            return false;
                                        }
                                    }
                                })
                            }
                        });
                    }
                    lookup_field.set_value(this._primary_key_field.value, lookup_value, slave_field_values, this);
                }
            }
            if (this.lookup_field) {
                this.close_view_form();
            }
        },

        get_default_field: function() {
            var i = 0;
            if (this._default_field === undefined) {
                this._default_field = null;
                for (i = 0; i < this.fields.length; i++) {
                    if (this.fields[i].is_default) {
                        this._default_field = this.fields[i];
                        break;
                    }
                }
            }
            return this._default_field;
        },

        set_edit_fields: function(fields) {
            this.edit_options.fields = fields;
        },

        set_view_fields: function(fields) {
            this.view_options.fields = fields;
        },

        round: function(num, dec) {
            //        return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
            return Number(num.toFixed(dec));
        },

        refresh: function(callback) {
        },

        _do_on_refresh_record: function(copy, callback) {
            var i, len;
            if (copy.record_count() === 1) {
                len = copy._dataset[0].length;
                for (i = 0; i < len; i++) {
                    this._dataset[this.rec_no][i] = copy._dataset[0][i];
                }
                this.update_controls(consts.UPDATE_CANCEL);
                if (callback) {
                    callback.call(this);
                }
            }
        },

        refresh_record: function(callback) {
            var args = this._check_args(arguments),
                callback = args['function'],
                async = args['boolean'],
                self = this,
                fields = [],
                primary_key = this._primary_key,
                where = {},
                copy;
            if (this.master) {
                throw 'The refresh_record method can not be executed for a detail item';
            }
            if (!this.rec_count) {
                return
            }
            copy = this.copy({filters: false, details: false, handlers: false});
            if (this._primary_key_field.value) {
                self.each_field(function(field) {
                    fields.push(field.field_name)
                })
                where[primary_key] = this._primary_key_field.value;

                if (callback || async) {
                    copy.open({expanded: this.expanded, fields: fields, where: where}, function() {
                        self._do_on_refresh_record(copy, callback);
                    });
                } else {
                    copy.open({expanded: this.expanded, fields: fields, where: where});
                    this._do_on_refresh_record(copy);
                }
            }
        },


        _do_on_refresh_page: function(rec_no, callback) {
            if (rec_no !== null) {
                this.rec_no = rec_no;
            }
            this.update_controls(consts.UPDATE_OPEN);
            if (callback) {
                callback.call(this);
            }
        },

        refresh_page: function(call_back) {
            var args = this._check_args(arguments),
                callback = args['function'],
                async = args['boolean'],
                self = this,
                rec_no = this.rec_no;
            if (!this.master) {
                if (callback || async) {
                    this.open({params: this._open_params, offset: this._open_params.__offset}, function() {
                        this._do_on_refresh_page(rec_no, callback);
                    });
                }
                else {
                    this.open({params: this._open_params, offset: this._open_params.__offset});
                    this._do_on_refresh_page(rec_no, callback);
                }
            }
        },

        format_string: function(str, value) {
            var result = str;
            if (typeof value === 'object') {
                for (var key in value) {
                    if (value.hasOwnProperty(key)) {
                        result = result.replace('%(' + key + ')s', value[key] + '')
                    }
                }
            }
            else {
                result = result.replace('%s', value + '')
            }
            return result
        }
    });

    /**********************************************************************/
    /*                           Report class                             */
    /**********************************************************************/

    Report.prototype = new AbsrtactItem();

    function Report(owner, ID, item_name, caption, visible, type, js_filename) {
        AbsrtactItem.call(this, owner, ID, item_name, caption, visible, type, js_filename);
        if (this.task && !(item_name in this.task)) {
            this.task[item_name] = this;
        }
        this._fields = [];
        this.params = this._fields;
        this._state = consts.STATE_EDIT;
        this.param_options = $.extend({}, this.task.form_options);
    }

    $.extend(Report.prototype, {
        constructor: Report,

        _set_item_state: function(value) {
            if (this._state !== value) {
                this._state = value;
            }
        },

        _get_item_state: function() {
            return this._state;
        },

        initAttr: function(info) {
            var i,
                params = info.fields,
                len;
            if (params) {
                len = params.length;
                for (i = 0; i < len; i++) {
                    new Param(this, params[i]);
                }
            }
        },

        _bind_item: function() {
            var i = 0,
                param,
                len = this.params.length;
            for (i = 0; i < len; i++) {
                param = this.params[i];
                if (param.lookup_item && (typeof param.lookup_item === "number")) {
                    param.lookup_item = this.task.item_by_ID(param.lookup_item);
                }
                if (param.lookup_field && (typeof param.lookup_field === "number")) {
                    param.lookup_field = param.lookup_item._field_by_ID(param.lookup_field).field_name;
                }
                if (param.lookup_values && (typeof param.lookup_values === "number")) {
                    param.lookup_values = self.task.lookup_lists[param.lookup_values];
                }
            }
            this.param_options.title = this.item_caption;
        },

        eachParam: function(callback) {
            var i = 0,
                len = this.params.length,
                value;
            for (; i < len; i++) {
                value = callback.call(this.params[i], this.params[i], i);
                if (value === false) {
                    break;
                }
            }
        },

        each_field: function(callback) {
            this.eachParam(callback);
        },

        param_by_name: function(name) {
            var i = 0,
                len = this.params.length;
            for (; i < len; i++) {
                if (this.params[i].param_name === name) {
                    return this.params[i];
                }
            }
        },

        create_param_form: function(container) {
            this._create_form('param', container);
        },

        close_param_form: function() {
            this._close_form('param');
        },

        print: function(p1, p2) {
            var self = this;
            this.load_modules([this, this.owner], function() {
                self._print(p1, p2);
            })
        },

        _print: function() {
            var args = this._check_args(arguments),
                callback = args['function'],
                create_form = args['boolean'];
            if (!create_form) {
                this.eachParam(function(param) {
                    if (param.edit_visible) {
                        create_form = true;
                        return false;
                    }
                });
            }
            if (create_form) {
                this.create_param_form();
            } else {
                this.process_report(callback);
            }
        },

        checkParams: function() {
            var i,
                len = this.params.length;
            for (i = 0; i < len; i++) {
                try {
                    this.params[i].check_valid();
                } catch (e) {
                    this.warning(e);
                    return false;
                }
            }
            return true;
        },

        process_report: function(callback) {
            var self = this,
                host = [location.protocol, '//', location.host, location.pathname].join(''),
                i,
                len,
                param_values = [];
            if (this.checkParams()) {
                if (this.task.on_before_print_report) {
                    this.task.on_before_print_report.call(this, this);
                }
                if (this.owner.on_before_print_report) {
                    this.owner.on_before_print_report.call(this, this);
                }
                if (this.on_before_print_report) {
                    this.on_before_print_report.call(this, this);
                }
                len = this.params.length;
                for (i = 0; i < len; i++) {
                    param_values.push(this.params[i].get_data());
                }
                this.send_request('print', [param_values, host, this.extension], function(result) {
                    var url,
                        error,
                        ext,
                        timeOut,
                        win;
                    if (result) {
                        url = result[0],
                        error = result[1];
                    }
                    if (error) {
                        self.warning(error);
                    }
                    if (url) {
                        if (self.on_open_report) {
                            self.on_open_report.call(self, self, url);
                        } else if (self.owner.on_open_report) {
                            self.owner.on_open_report.call(self.owner, self, url);
                        } else {
                            ext = url.split('.').pop();
                            if (ext === 'ods') {
                                window.open(url, "_self");
                            } else {
                                win = window.open(url, "_blank")
                                if (self.send_to_printer) {
                                    win.onload = function() {
                                        win.print();
                                        timeOut = setTimeout(
                                            function() {
                                                win.onfocus = function() {
                                                    win.close();
                                                }
                                            },
                                            1000
                                        );
                                    }
                                }
                            }
                        }
                    }
                    if (callback) {
                        callback.call(self, self, url);
                    }
                });
                return true;
            }
        },

        create_param_inputs: function(container, options) {
            var default_options,
                i, len, col,
                params = [],
                cols = [],
                form,
                tabindex;

            if (!container.length) {
                return;
            }

            default_options = {
                params: [],
                col_count: 1,
                label_on_top: false,
                label_width: undefined,
                autocomplete: false,
                in_well: true,
                tabindex: undefined
            }

            options = $.extend({}, default_options, options);

            if (options.params.length) {
                len = options.params.length;
                for (i = 0; i < len; i++) {
                    params.push(this.param_by_name(options.params[i]));
                }
            } else {
                this.eachParam(function(param) {
                    if (param.edit_visible && param.edit_index !== -1) {
                        params.push(param);
                    }
                });
                params.sort(function(param1, param2) {
                    if (param1.edit_index > param2.edit_index === 0) {
                        return 0;
                    }
                    if (param1.edit_index > param2.edit_index) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
            }
            container.empty();
            form = $('<form form class="row-fluid" autocomplete="off"></form>').appendTo($("<div></div>").addClass("row-fluid").appendTo(container));
            if (options.in_well) {
                form.addClass('well');
            }
            if (options.autocomplete) {
                form.attr("autocomplete", "on")
            }
            if (!options.label_on_top) {
                form.addClass("form-horizontal");
            }
            len = params.length;
            for (col = 0; col < options.col_count; col++) {
                cols.push($("<div></div>").addClass("span" + 12 / options.col_count).appendTo(form));
            }
            tabindex = options.tabindex;
            if (!tabindex && this.param_form) {
                tabindex = this.param_form.tabindex;
                this.param_form.tabindex += len;
            }
            for (i = 0; i < len; i++) {
                new DBInput(params[i], i + tabindex,
                    cols[Math.floor(i % options.col_count)], options);
            }
        }
    });

    /**********************************************************************/
    /*                            Detail class                            */
    /**********************************************************************/

    Detail.prototype = new Item();
    Detail.prototype.constructor = Detail;

    function Detail(owner, ID, item_name, caption, visible, type, js_filename) {
        Item.call(this, owner, ID, item_name, caption, visible, type, js_filename);

        if (owner) {
            this.master = owner;
            owner.details.push(this);
            owner.details[item_name] = this;
        }
        this.item_type = "detail";
    }

    Detail.prototype.getChildClass = function() {
        return undefined;
    };

    /**********************************************************************/
    /*                             Field class                            */
    /**********************************************************************/

    function Field(owner, info) {
        this.owner = owner;
        this.set_info(info);
        this.controls = [];
        this.bind_index = null;
        this.lookup_index = null;
        this.field_type = field_type_names[this.data_type];
        this.field_kind = consts.ITEM_FIELD;
        if (owner) {
            owner._fields.push(this);
        }
        Object.defineProperty(this, "data", {
            get: function() {
                return this.get_data();
            }
        });
        Object.defineProperty(this, "value", {
            get: function() {
                return this.get_value();
            },
            set: function(new_value) {
                this.set_value(new_value);
            }
        });
        Object.defineProperty(this, "raw_value", {
            get: function() {
                return this.get_raw_value();
            },
        });
        Object.defineProperty(this, "text", {
            get: function() {
                return this.get_text();
            },
            set: function(new_value) {
                this.set_text(new_value);
            }
        });
        Object.defineProperty(this, "display_text", {
            get: function() {
                return this.get_display_text();
            }
        });
        Object.defineProperty(this, "lookup_text", {
            get: function() {
                return this.get_lookup_text();
            }
        });
        Object.defineProperty(this, "lookup_value", {
            get: function() {
                return this.get_lookup_value();
            },
            set: function(new_value) {
                this.set_lookup_value(new_value);
            }
        });
        Object.defineProperty(this, "lookup_type", {
            get: function() {
                return field_type_names[this.get_lookup_data_type()];
            },
        });
        Object.defineProperty(this, "alignment", {
            get: function() {
                return this.get_alignment();
            },
            set: function(new_value) {
                this.set_alignment(new_value);
            }
        });
        Object.defineProperty(this, "read_only", {
            get: function() {
                return this._get_read_only();
            },
            set: function(new_value) {
                this._set_read_only(new_value);
            }
        });
    }

    Field.prototype = {
        constructor: Field,

        copy: function(owner) {
            var result = new Field(owner, this.get_info());
            result.lookup_item = this.lookup_item;
            result.lookup_field = this.lookup_field;
            return result;
        },

        get_info: function() {
            var i,
                len = field_attr.length,
                result = [];
            for (i = 0; i < len; i++) {
                result.push(this[field_attr[i]]);
            }
            return result;
        },

        set_info: function(info) {
            if (info) {
                var i,
                    len = field_attr.length;
                for (i = 0; i < len; i++) {
                    this[field_attr[i]] = info[i];
                }
            }
        },

        get_row: function() {
            if (this.owner._dataset && this.owner._dataset.length) {
                return this.owner._dataset[this.owner._get_rec_no()];
            } else {
                var mess = language.value_in_empty_dataset.replace('%s', this.owner.item_name);
                if (this.owner) {
                    this.owner.warning(mess);
                }
                throw mess
            }
        },

        get_data: function() {
            var row;
            if (this.field_kind === consts.ITEM_FIELD) {
                row = this.get_row();
                if (row && this.bind_index >= 0) {
                    return row[this.bind_index];
                }
            } else {
                return this._value;
            }
        },

        set_data: function(value) {
            var row;
            if (this.field_kind === consts.ITEM_FIELD) {
                row = this.get_row();
                if (row && this.bind_index >= 0) {
                    row[this.bind_index] = value;
                }
            } else {
                this._value = value;
            }
        },

        get_lookup_data: function() {
            var row;
            if (this.field_kind === consts.ITEM_FIELD) {
                row = this.get_row();
                if (row && this.lookup_index >= 0) {
                    return row[this.lookup_index];
                }
            } else {
                return this._lookup_value;
            }
        },

        set_lookup_data: function(value) {
            var row;
            if (this.field_kind === consts.ITEM_FIELD) {
                row = this.get_row();
                if (row && this.lookup_index >= 0) {
                    row[this.lookup_index] = value;
                }
            } else {
                this._lookup_value = value
            }
        },

        get_text: function() {
            var result = "",
                error = "";
            try {
                if (this.data !== null) {
                    result = this.value;
                    switch (this.data_type) {
                        case consts.TEXT:
                            break;
                        case consts.INTEGER:
                            result = this.int_to_str(result);
                            break;
                        case consts.FLOAT:
                            result = this.float_to_str(result);
                            break;
                        case consts.CURRENCY:
                            result = this.float_to_str(result);
                            break;
                        case consts.DATE:
                            result = this.date_to_str(result);
                            break;
                        case consts.DATETIME:
                            result = this.datetime_to_str(result);
                            break;
                        case consts.BOOLEAN:
                            if (this.get_value()) {
                                result = language.yes;
                            } else {
                                result = language.no;
                            }
                            break;
                        case consts.KEYS:
                            if (result.length) {
                                result = language.items_selected.replace('%s', result.length);
                            }
                            break;
                    }
                }
                //~ } else {
                    //~ result = "";
                //~ }
            } catch (e) {
                result = '';
                console.error(e);
            }
            if (typeof result !== 'string') {
                result = ''
            }
            return result;
        },

        set_text: function(value) {
            var error = "";

            if (value !== this.get_text()) {
                switch (this.data_type) {
                    case consts.TEXT:
                        this.set_value(value);
                        break;
                    case consts.INTEGER:
                        this.set_value(this.str_to_int(value));
                        break;
                    case consts.FLOAT:
                        this.set_value(this.str_to_float(value));
                        break;
                    case consts.CURRENCY:
                        this.set_value(this.str_to_float(value));
                        break;
                    case consts.DATE:
                        this.set_value(this.str_to_date(value));
                        break;
                    case consts.DATETIME:
                        this.set_value(this.str_to_datetime(value));
                        break;
                    case consts.BOOLEAN:
                        if (language) {
                            if (value.length && value.toUpperCase().trim() === language.yes.toUpperCase().trim()) {
                                this.set_value(true);
                            } else {
                                this.set_value(false);
                            }
                        } else {
                            if (value.length && (value[0] === 'T' || value[0] === 't')) {
                                this.set_value(true);
                            } else {
                                this.set_value(false);
                            }
                        }
                        break;
                    case consts.KEYS:
                        break;
                    default:
                        this.set_value(value);
                }
            }
        },

        _convert_date_time: function(value) {
            if (value) {
                if (value.search('.') !== -1) {
                    value = value.split('.')[0];
                }
                return this.format_string_to_date(value, '%Y-%m-%d %H:%M:%S');
            }
            else return value;
        },

        _convert_date: function(value) {
            if (value) {
                if (value.search(' ') !== -1) {
                    value = value.split(' ')[0];
                }
                return this.format_string_to_date(value, '%Y-%m-%d');
            }
            else return value;
        },

        _convert_keys: function(value) {
            var result = [];
            if (this.get_lookup_data()) {
                return this.get_lookup_data();
            }
            else if (value) {
                if (this.get_lookup_data_type() === consts.TEXT) {
                    result = value.split(';')
                }
                else {
                    result = value.split(';').map(function(i) {
                        return parseInt(i, 10);
                    });
                }
            }
            this.set_lookup_data(result);
            return result;
        },

        get_raw_value: function() {
            var result = this.get_data();
            if (this.data_type === consts.DATETIME && result) {
                result = result.replace('T', ' ');
            }
            else if (this.multi_select) {
                if (result instanceof Array) {
                    if (!result.length) {
                        result = null;
                    }
                }
            }
            return result;
        },

        get_value: function() {
            var value = this.get_raw_value();
            if (value === null) {
                if (this.field_kind === consts.ITEM_FIELD) {
                    switch (this.data_type) {
                        case consts.INTEGER:
                            value = 0;
                            break;
                        case consts.FLOAT:
                            value = 0;
                            break;
                        case consts.CURRENCY:
                            value = 0;
                            break;
                        case consts.TEXT:
                            value = '';
                            break;
                        case consts.BOOLEAN:
                            value = false;
                            break;
                        case consts.KEYS:
                            value = [];
                            break;
                    }
                }
                else if (this.data_type === consts.KEYS) {
                    value = [];
                }
            }
            else {
                switch (this.data_type) {
                    case consts.DATE:
                        value = this._convert_date(value);
                        break;
                    case consts.DATETIME:
                        value = this._convert_date_time(value);
                        break;
                    case consts.BOOLEAN:
                        return value ? true : false;
                        break;
                    case consts.KEYS:
                        return this._convert_keys(value);
                        break;
                }
            }
            return value;
        },

        _change_lookup_field: function(lookup_value, slave_field_values) {
            var self = this,
                item = this.owner,
                master_field;
            if (this.lookup_item) {
                if (this.owner) {
                    master_field = this;
                    if (this.master_field) {
                        master_field = this.master_field
                    }
                    master_field.lookup_value = null;
                    this.owner.each_field(function(field) {
                        if (field.master_field === master_field) {
                            if (master_field === self && slave_field_values && slave_field_values[field.field_name]) {
                                field.lookup_value = slave_field_values[field.field_name]
                            }
                            else {
                                field.lookup_value = null;
                            }
                        }
                    });
                }
                if (lookup_value) {
                    this.lookup_value = lookup_value;
                }
            }
        },

        _do_before_changed: function() {
            if (this.field_kind === consts.ITEM_FIELD) {
                if (this.owner._get_item_state() !== consts.STATE_INSERT && this.owner._get_item_state() !== consts.STATE_EDIT) {
                    throw language.not_edit_insert_state.replace('%s', this.owner.item_name);
                }
                if (this.owner.on_before_field_changed) {
                    this.owner.on_before_field_changed.call(this.owner, this);
                }
            }
        },

        _do_after_changed: function(lookup_item) {
            if (this.owner && this.owner.on_field_changed) {
                this.owner.on_field_changed.call(this.owner, this, lookup_item);
            }
            if (this.filter) {
                this.filter.update(this);
                if (this.filter.owner.on_filter_changed) {
                    this.filter.owner.on_filter_changed.call(this.filter.owner, this.filter);
                }
            }
        },

        _check_system_field_value: function(value) {
            if (this.field_kind === consts.ITEM_FIELD) {
                if (this.field_name === this.owner._primary_key && this.value && this.value !== value) {
                    throw language.no_primary_field_changing.replace('%s', this.owner.item_name);
                }
                if (this.field_name === this.owner._deleted_flag && this.value !== value) {
                    throw language.no_deleted_field_changing.replace('%s', this.owner.item_name);
                }
            }
        },

        set_value: function(value, lookup_value, slave_field_values, lookup_item) {
            if (value === undefined) {
                value = null;
            }
            this._check_system_field_value(value);
            this.new_value = null;
            this.new_lookup_value = lookup_value;
            if (value !== null) {
                this.new_value = value;
                if (!this.multi_select) {
                    switch (this.data_type) {
                        case consts.INTEGER:
                            this.new_value = value;
                            if (typeof(value) === "string") {
                                this.new_value = parseInt(value, 10);
                            }
                            break;
                        case consts.FLOAT:
                            this.new_value = value;
                            if (typeof(value) === "string") {
                                this.new_value = parseFloat(value);
                            }
                            break;
                        case consts.CURRENCY:
                            this.new_value = value;
                            if (typeof(value) === "string") {
                                this.new_value = parseFloat(value);
                            }
                            break;
                        case consts.BOOLEAN:
                            this.new_value = value ? 1 : 0;
                            break;
                        case consts.DATE:
                            this.new_value = this.format_date_to_string(value, '%Y-%m-%d');
                            break;
                        case consts.DATETIME:
                            this.new_value = this.format_date_to_string(value, '%Y-%m-%d %H:%M:%S');
                            break;
                        case consts.TEXT:
                            this.new_value = value + '';
                            break;
                        case consts.KEYS:
                            this.new_value = value.join(';')
                            lookup_value = value;
                            break;
                    }
                }
            }
            if (this.get_raw_value() !== this.new_value) {
                this._do_before_changed();
                try {
                    this.set_data(this.new_value);
                } catch (e) {
                    throw this.field_name + ": " + this.type_error();
                }
                this._change_lookup_field(lookup_value, slave_field_values);
                this._set_modified(true);
                this._do_after_changed(lookup_item);
            } else if (lookup_value && lookup_value !== this.lookup_value) {
                this.lookup_value = lookup_value;
                this._do_after_changed(lookup_item, slave_field_values);
            }
            this.new_value = null;
            this.new_lookup_value = null;
            this.update_controls();
        },

        _set_modified: function(value) {
            if (this.field_kind === consts.ITEM_FIELD) {
                if (this.owner._set_modified && !this.calculated) {
                    this.owner._set_modified(value);
                }
            }
        },

        get_lookup_data_type: function() {
            if (this.lookup_values) {
                return consts.TEXT;
            } else if (this.lookup_item) {
                if (this.lookup_field2) {
                    return this.lookup_item2._field_by_name(this.lookup_field2).data_type;
                }
                else if (this.lookup_field1) {
                    return this.lookup_item1._field_by_name(this.lookup_field1).data_type;
                }
                else {
                    return this.lookup_item._field_by_name(this.lookup_field).data_type;
                }
            } else {
                return this.data_type
            }
        },

        _get_value_in_list: function(value) {
            var i = 0,
                len = this.lookup_values.length,
                result = '';
            if (value === undefined) {
                value = this.value;
            }
            for (; i < len; i++) {
                if (this.lookup_values[i][0] === value) {
                    result = this.lookup_values[i][1];
                }
            }
            return result
        },

        get_lookup_value: function() {
            var value = null;
            if (this.lookup_values) {
                try {
                    value = this._get_value_in_list();
                } catch (e) {}
            }
            else if (this.lookup_item) {
                if (this.get_value()) {
                    value = this.get_lookup_data();
                    switch (this.get_lookup_data_type()) {
                        case consts.DATE:
                            if (typeof(value) === "string") {
                                value = this._convert_date(value);
                            }
                            break;
                        case consts.DATETIME:
                            if (typeof(value) === "string") {
                                value = this._convert_date_time(value);
                            }
                            break;
                        case consts.BOOLEAN:
                            if (value) {
                                return true;
                            } else {
                                return false;
                            }
                            break;
                    }
                }
            } else {
                value = this.get_value();
            }
            return value;
        },

        set_lookup_value: function(value) {
            if (this.lookup_item) {
                this.set_lookup_data(value);
                this.update_controls();
            }
        },

        get_lookup_text: function() {
            var self = this,
                data_type,
                lookup_field,
                result = '';
            try {
                if (this.lookup_values) {
                    result = this.get_lookup_value();
                }
                else if (this.lookup_item) {
                    if (this.data_type === consts.KEYS) {
                        result = this.text;
                    }
                    else if (this.get_value()) {
                        lookup_field = this.lookup_item.field_by_name(this.lookup_field);
                        if (lookup_field.lookup_values) {
                            result = lookup_field._get_value_in_list(this.lookup_value);
                        }
                        else {
                            result = this.get_lookup_value();
                        }
                    }
                    if (result === null) {
                        result = '';
                    } else {
                        data_type = this.get_lookup_data_type()
                        if (data_type) {
                            switch (data_type) {
                                case consts.DATE:
                                    result = this.date_to_str(result);
                                    break;
                                case consts.DATETIME:
                                    result = this.datetime_to_str(result);
                                    break;
                                case consts.FLOAT:
                                    result = this.float_to_str(result);
                                    break;
                                case consts.CURRENCY:
                                    result = this.cur_to_str(result);
                                    break;
                            }
                        }
                    }
                }
            } catch (e) {}
            return result;
        },

        get_display_text: function() {
            var res,
                len,
                value,
                result = '';
            if (this.multi_select) {
                value = this.raw_value;
                if (value instanceof Array) {
                    len = value.length;
                }
                if (len) {
                    if (len === 1 && this.lookup_value) {
                        result = this.lookup_value;
                    }
                    else {
                        result = language.items_selected.replace('%s', len);
                    }
                }
            }
            else if (this.lookup_values) {
                result = this.get_lookup_text();
                if (result === '&nbsp') result = '';
            } else if (this.lookup_item) {
                if (this.field_kind === consts.ITEM_FIELD && !this.owner.expanded) {
                    result = this.get_text();
                }
                else {
                    result = this.get_lookup_text();
                }
            } else {
                if (this.data_type === consts.CURRENCY) {
                    if (this.raw_value !== null) {
                        result = this.cur_to_str(this.get_value());
                    }
                } else {
                    result = this.get_text();
                }
            }
            if (this.owner && (this.owner.on_field_get_text || this.owner.on_get_field_text)) {
                if (!this.on_field_get_text_called) {
                    this.on_field_get_text_called = true;
                    try {
                        if (this.owner.on_field_get_text) {
                            res = this.owner.on_field_get_text.call(this.owner, this);
                        }
                        else if (this.owner.on_get_field_text) {
                            res = this.owner.on_get_field_text.call(this.owner, this);
                        }
                        if (res !== undefined) {
                            result = res;
                        }
                    } finally {
                        this.on_field_get_text_called = false;
                    }
                }
            }
            if (result === undefined) {
                result = '';
            }
            return result;
        },

        _set_read_only: function(value) {
            this._read_only = value;
            this.update_controls();
        },

        _get_read_only: function() {
            var result = this._read_only;
            if (this.owner && this.owner._get_read_only && this.owner._get_read_only()) {
                result = this.owner._get_read_only();
            }
            return result;
        },

        set_visible: function(value) {
            this._visible = value;
            this.update_controls();
        },

        get_visible: function() {
            return this._visible;
        },

        set_alignment: function(value) {
            this._alignment = value;
            this.update_controls();
        },

        get_alignment: function() {
            return this._alignment;
        },

        set_expand: function(value) {
            this._expand = value;
            this.update_controls();
        },

        get_expand: function() {
            return this._expand;
        },

        set_word_wrap: function(value) {
            this._word_wrap = value;
            this.update_controls();
        },

        get_word_wrap: function() {
            return this._word_wrap;
        },

        check_type: function() {
            this.get_value();
            if ((this.data_type === consts.TEXT) && (this.field_size !== 0) && (this.get_text().length > this.field_size)) {
                throw this.field_caption + ': ' + language.invalid_length.replace('%s', this.field_size);
            }
            return true;
        },

        check_reqired: function() {
            if (!this.required) {
                return true;
            } else if (this.data !== null) {
                return true;
            } else {
                throw this.field_caption + ': ' + language.value_required;
            }
        },

        get_mask: function() {
            var ch = '',
                format,
                result = '';
            if (this.data_type === consts.DATE) {
                format = locale.D_FMT;
            }
            else if (this.data_type === consts.DATETIME) {
                format = locale.D_T_FMT;
            }
            if (format) {
                for (var i = 0; i < format.length; ++i) {
                    ch = format.charAt(i);
                    switch (ch) {
                        case "%":
                            break;
                        case "d":
                        case "m":
                            result += '99';
                            break;
                        case "Y":
                            result += '9999';
                            break;
                        case "H":
                        case "M":
                        case "S":
                            result += '99';
                            break;
                        default:
                            result += ch;
                    }
                }
            }
            return result;
        },

        check_valid: function() {
            var err;
            if (this.check_reqired()) {
                if (this.check_type()) {
                    if (this.owner && this.owner.on_field_validate) {
                        err = this.owner.on_field_validate.call(this.owner, this);
                        if (err) {
                            throw err;
                            return;
                        }
                    }
                    if (this.filter) {
                        err = this.filter.check_value(this)
                        if (err) {
                            throw err;
                            return;
                        }
                    }
                    return true;
                }
            }
        },

        typeahead_options: function() {
            var self = this,
                length = 10,
                lookup_item = self.lookup_item.copy(),
                result;
            lookup_item.lookup_field = this,
            result = {
                length: length,
                lookup_item: lookup_item,
                source: function(query, process) {
                    var params = {}
                    self._do_select_value(lookup_item);
                    params.__search = [self.lookup_field, query, consts.FILTER_CONTAINS_ALL];
                    lookup_item.open({limit: length, params: params}, function(item) {
                        var data = [],
                            field = item.field_by_name(self.lookup_field);
                        item.each(function(i) {
                            data.push([i._primary_key_field.value, field.value]);
                        });
                        return process(data);
                    });
                }
            }
            return result;
        },

        get_typeahead_defs: function($input) {
            var self = this,
                lookup_item,
                items = 10,
                def;

            lookup_item = self.lookup_item.copy(),
            lookup_item.lookup_field = this,
            def = {
                items: items,
                lookup_item: lookup_item,
                field: this,
                source: function(query, process) {
                    var params = {};
                    self._do_select_value(lookup_item);
                    params.__search = [self.lookup_field, query, consts.FILTER_CONTAINS_ALL];
                    lookup_item.open({limit: items, params: params}, function(item) {
                        var data = [],
                            field = item.field_by_name(self.lookup_field);
                        item.each(function(i) {
                            data.push([i._primary_key_field.value, field.value]);
                        });
                        return process(data);
                    });
                },
            }
            return def;
        },

        numeric_field: function() {
            if (!this.lookup_item && (
                this.data_type === consts.INTEGER ||
                this.data_type === consts.FLOAT ||
                this.data_type === consts.CURRENCY)) {
                return true;
            }
        },

        system_field: function() {
            if (this.field_name === this.owner._primary_key ||
                this.field_name === this.owner._deleted_flag ||
                this.field_name === this.owner._master_id ||
                this.field_name === this.owner._master_rec_id) {
                return true;
            }
        },

        _check_args: function(args) {
            var i,
                result = {};
            for (i = 0; i < args.length; i++) {
                result[typeof args[i]] = args[i];
            }
            return result;
        },

        update_controls: function() {
            var i,
                len,
                args = this._check_args(arguments),
                owner_updating = args['boolean'],
                state = args['number'];

            len = this.controls.length;
            for (i = 0; i < len; i++) {
                this.controls[i].update(state);
            }
            if (!owner_updating && this.owner && this.owner.controls) {
                len = this.owner.controls.length;
                for (i = 0; i < len; i++) {
                    this.owner.controls[i].update_field(this);
                }
            }
        },

        update_control_state: function(error) {
            for (var i = 0; i < this.controls.length; i++) {
                this.controls[i].error = error;
                this.controls[i].updateState(false);
            }
        },

        type_error: function() {
            switch (this.data_type) {
                case consts.INTEGER:
                    return language.invalid_int.replace('%s', '');
                case consts.FLOAT:
                    return language.invalid_float.replace('%s', '');
                case consts.CURRENCY:
                    return language.invalid_cur.replace('%s', '');
                case consts.DATE:
                    return language.invalid_date.replace('%s', '');
                case consts.DATE_TIME:
                    return language.invalid_date.replace('%s', '');
                case consts.BOOLEAN:
                    return language.invalid_bool.replace('%s', '');
                default:
                    return language.invalid_value.replace('%s', '');
            }
        },

        valid_char_code: function(code) {
            var ch = String.fromCharCode(code),
                isDigit = code >= 48 && code <= 57,
                decPoint = ch === '.' || ch === locale.DECIMAL_POINT || ch === locale.MON_DECIMAL_POINT,
                sign = ch === '+' || ch === '-',
                data_type = this.get_lookup_data_type();
            if (data_type === consts.INTEGER) {
                if (!isDigit && !sign) {
                    return false;
                }
            }
            if (data_type === consts.FLOAT || data_type === consts.CURRENCY) {
                if (!isDigit && !sign && !decPoint) {
                    return false;
                }
            }
            return true;
        },

        str_to_int: function(str) {
            var result = parseInt(str, 10);
            if (isNaN(result)) {
                throw "invalid integer value";
            }
            return result;
        },

        str_to_date: function(str) {
            return this.format_string_to_date(str, locale.D_FMT);
        },

        str_to_datetime: function(str) {
            return this.format_string_to_date(str, locale.D_T_FMT);
        },

        str_to_float: function(text) {
            var result;
            text = text.replace(locale.DECIMAL_POINT, ".")
            text = text.replace(locale.MON_DECIMAL_POINT, ".")
            result = parseFloat(text);
            if (isNaN(result)) {
                throw "invalid float value";
            }
            return result;
        },

        str_to_cur: function(val) {
            var result = '';
            if (value) {
                result = $.trim(val);
                if (locale.MON_THOUSANDS_SEP) {
                    result = result.replace(locale.MON_THOUSANDS_SEP, '');
                }
                if (locale.CURRENCY_SYMBOL) {
                    result = $.trim(result.replace(locale.CURRENCY_SYMBOL, ''));
                }
                if (locale.POSITIVE_SIGN) {
                    result = result.replace(locale.POSITIVE_SIGN, '');
                }
                if (locale.NEGATIVE_SIGN && result.indexOf(locale.NEGATIVE_SIGN) !== -1) {
                    result = result.replace(locale.NEGATIVE_SIGN, '')
                    result = '-' + result
                }
                result = $.trim(result.replace(locale.MON_DECIMAL_POINT, '.'));
                result = parseFloat(result);
            }
            return result;
        },

        int_to_str: function(value) {
            if (value || value === 0) {
                return value.toString();
            }
            else {
                return '';
            }
        },

        float_to_str: function(value) {
            var str,
                i,
                result = '';
            if (value || value === 0) {
                str = ('' + value.toFixed(6)).replace(".", locale.DECIMAL_POINT);
                i = str.length - 1;
                for (; i >= 0; i--) {
                    if ((str[i] === '0') && (result.length === 0)) {
                        continue;
                    } else {
                        result = str[i] + result;
                    }
                }
                if (result.slice(result.length - 1) === locale.DECIMAL_POINT) {
                    result = result + '0';
                }
            }
            return result;
        },

        date_to_str: function(value) {
            if (value) {
                return this.format_date_to_string(value, locale.D_FMT);
            }
            else {
                return '';
            }
        },

        datetime_to_str: function(value) {
            if (value) {
                return this.format_date_to_string(value, locale.D_T_FMT);
            }
            else {
                return '';
            }
        },

        cur_to_str: function(value) {
            var point,
                dec,
                digits,
                i,
                d,
                count = 0,
                len,
                result = '';

            if (value || value === 0) {
                result = value.toFixed(locale.FRAC_DIGITS);
                if (isNaN(result[0])) {
                    result = result.slice(1, result.length);
                }
                point = result.indexOf('.');
                dec = '';
                digits = result;
                if (point >= 0) {
                    digits = result.slice(0, point);
                    dec = result.slice(point + 1, result.length);
                }
                result = '';
                len = digits.length;
                for (i = 0; i < len; i++) {
                    d = digits[len - i - 1];
                    result = d + result;
                    count += 1;
                    if ((count % 3 === 0) && (i !== len - 1)) {
                        result = locale.MON_THOUSANDS_SEP + result;
                    }
                }
                if (dec) {
                    result = result + locale.MON_DECIMAL_POINT + dec;
                }
                if (value < 0) {
                    if (locale.N_SIGN_POSN === 3) {
                        result = locale.NEGATIVE_SIGN + result;
                    } else if (locale.N_SIGN_POSN === 4) {
                        result = settings.result + locale.NEGATIVE_SIGN;
                    }
                } else {
                    if (locale.P_SIGN_POSN === 3) {
                        result = locale.POSITIVE_SIGN + result;
                    } else if (locale.P_SIGN_POSN === 4) {
                        result = result + locale.POSITIVE_SIGN;
                    }
                }
                if (locale.CURRENCY_SYMBOL) {
                    if (value < 0) {
                        if (locale.N_CS_PRECEDES) {
                            if (locale.N_SEP_BY_SPACE) {
                                result = locale.CURRENCY_SYMBOL + ' ' + result;
                            } else {
                                result = locale.CURRENCY_SYMBOL + result;
                            }
                        } else {
                            if (locale.N_SEP_BY_SPACE) {
                                result = result + ' ' + locale.CURRENCY_SYMBOL;
                            } else {
                                result = result + locale.CURRENCY_SYMBOL;
                            }
                        }
                    } else {
                        if (locale.P_CS_PRECEDES) {
                            if (locale.P_SEP_BY_SPACE) {
                                result = locale.CURRENCY_SYMBOL + ' ' + result;
                            } else {
                                result = locale.CURRENCY_SYMBOL + result;
                            }
                        } else {
                            if (locale.P_SEP_BY_SPACE) {
                                result = result + ' ' + locale.CURRENCY_SYMBOL;
                            } else {
                                result = result + locale.CURRENCY_SYMBOL;
                            }
                        }
                    }
                }
                if (value < 0) {
                    if (locale.N_SIGN_POSN === 0 && locale.NEGATIVE_SIGN) {
                        result = locale.NEGATIVE_SIGN + '(' + result + ')';
                    } else if (locale.N_SIGN_POSN === 1) {
                        result = locale.NEGATIVE_SIGN + result;
                    } else if (locale.N_SIGN_POSN === 2) {
                        result = result + locale.NEGATIVE_SIGN;
                    }
                } else {
                    if (locale.P_SIGN_POSN === 0 && locale.POSITIVE_SIGN) {
                        result = locale.POSITIVE_SIGN + '(' + result + ')';
                    } else if (locale.P_SIGN_POSN === 1) {
                        result = locale.POSITIVE_SIGN + result;
                    } else if (locale.P_SIGN_POSN === 2) {
                        result = result + locale.POSITIVE_SIGN;
                    }
                }
            }
            return result;
        },

        parseDateInt: function(str, digits) {
            var result = parseInt(str.substring(0, digits), 10);
            if (isNaN(result)) {
                //            result = 0
                throw 'invalid date';
            }
            return result;
        },

        format_string_to_date: function(str, format) {
            var ch = '',
                substr = str,
                day, month, year,
                hour = 0,
                min = 0,
                sec = 0;
            for (var i = 0; i < format.length; ++i) {
                ch = format.charAt(i);
                switch (ch) {
                    case "%":
                        break;
                    case "d":
                        day = this.parseDateInt(substr, 2);
                        substr = substr.slice(2);
                        break;
                    case "m":
                        month = this.parseDateInt(substr, 2);
                        substr = substr.slice(2);
                        break;
                    case "Y":
                        year = this.parseDateInt(substr, 4);
                        substr = substr.slice(4);
                        break;
                    case "H":
                        hour = this.parseDateInt(substr, 2);
                        substr = substr.slice(2);
                        break;
                    case "M":
                        min = this.parseDateInt(substr, 2);
                        substr = substr.slice(2);
                        break;
                    case "S":
                        sec = this.parseDateInt(substr, 2);
                        substr = substr.slice(2);
                        break;
                    default:
                        substr = substr.slice(ch.length);
                }
            }
            return new Date(year, month - 1, day, hour, min, sec);
        },

        leftPad: function(value, len, ch) {
            var result = value.toString();
            while (result.length < len) {
                result = ch + result;
            }
            return result;
        },

        format_date_to_string: function(date, format) {
            var ch = '',
                result = '';
            for (var i = 0; i < format.length; ++i) {
                ch = format.charAt(i);
                switch (ch) {
                    case "%":
                        break;
                    case "d":
                        result += this.leftPad(date.getDate(), 2, '0');
                        break;
                    case "m":
                        result += this.leftPad(date.getMonth() + 1, 2, '0');
                        break;
                    case "Y":
                        result += date.getFullYear();
                        break;
                    case "H":
                        result += this.leftPad(date.getHours(), 2, '0');
                        break;
                    case "M":
                        result += this.leftPad(date.getMinutes(), 2, '0');
                        break;
                    case "S":
                        result += this.leftPad(date.getSeconds(), 2, '0');
                        break;
                    default:
                        result += ch;
                }
            }
            return result;
        },

        _do_select_value: function(lookup_item) {
            if (this.owner && this.owner.on_param_select_value) {
                this.owner.on_param_select_value.call(this.owner, this, lookup_item);
            }
            if (this.owner && this.owner.on_field_select_value) {
                this.owner.on_field_select_value.call(this.owner, this, lookup_item);
            }
            if (this.filter && this.filter.owner.on_filter_select_value) {
                this.filter.owner.on_filter_select_value.call(this.filter.owner, this.filter, lookup_item);
            }
        },

        select_value: function() {
            var self = this,
                copy = this.lookup_item.copy(),
                on_view_form_closed = copy.on_view_form_closed;
            if (!copy.can_view()) {
                task.alert(task.language.cant_view.replace('%s', copy.item_caption));
                return;
            }
            copy.is_lookup_item = true; //depricated
            copy.lookup_field = this;
            if (this.data_type === consts.KEYS) {
                copy.selections = this.value;
                copy.on_view_form_closed = function(item) {
                    if (on_view_form_closed) {
                        on_view_form_closed(item);
                    }
                    self.value = copy.selections;
                }
            }
            this._do_select_value(copy);
            copy.view();
        }
    };

    /**********************************************************************/
    /*                            Filter class                            */
    /**********************************************************************/

    function Filter(owner, info) {
        var self = this,
            field;

        this.owner = owner;
        this.set_info(info);
        if (owner) {
            owner.filters.push(this);
            if (!(this.filter_name in owner.filters)) {
                owner.filters[this.filter_name] = this;
            }
            if (this.field_name) {
                field = this.owner._field_by_ID(this.field_name);
                this.field = this.create_field(field);
                this.field.required = false;
                if (this.field.lookup_values && (typeof this.field.lookup_values === "number")) {
                    this.field.lookup_values = this.owner.task.lookup_lists[this.field.lookup_values];
                }
                this.field.field_help = this.filter_help;
                this.field.field_placeholder = this.filter_placeholder;
                this.field.multi_select_all = this.multi_select_all;
                if (this.filter_type === consts.FILTER_IN || this.filter_type === consts.FILTER_NOT_IN) {
                    this.field.multi_select = true;
                }
                if (this.filter_type === consts.FILTER_RANGE) {
                    this.field1 = this.create_field(field);
                    this.field1.field_help = undefined;
                }
                if (this.field.data_type === consts.BOOLEAN) {
                    //~ this.field.data_type = consts.INTEGER;
                    this.field.lookup_values = [[null, '&nbsp'], [false, language.no], [true, language.yes]];
                }
            }
        }
        Object.defineProperty(this, "value", {
            get: function() {
                return this.get_value();
            },
            set: function(new_value) {
                this.set_value(new_value);
            }
        });
        Object.defineProperty(this, "text", {
            get: function() {
                return this.get_text();
            }
        });
    }

    Filter.prototype = {
        constructor: Filter,

        create_field: function(field) {
            var result = new Field();
            result.set_info(field.get_info());
            result._read_only = false;
            result.filter = this;
            result._value = null;
            result._lookup_value = null;
            result.field_kind = consts.FILTER_FIELD;
            return result;
        },

        copy: function(owner) {
            var result = new Filter(owner, this.get_info());
            return result;
        },

        get_info: function() {
            var i,
                len = filter_attr.length,
                result = [];
            for (i = 0; i < len; i++) {
                result.push(this[filter_attr[i]]);
            }
            return result;
        },

        set_info: function(info) {
            if (info) {
                var i,
                    len = filter_attr.length;
                for (i = 0; i < len; i++) {
                    this[filter_attr[i]] = info[i];
                }
            }
        },

        get_value: function() {
            var result;
            if (this.filter_type === consts.FILTER_RANGE) {
                if (this.field.raw_value !== null && this.field1.raw_value !== null) {
                    return [this.field.raw_value, this.field1.raw_value];
                }
                else {
                    return null;
                }
            }
            else {
                return this.field.raw_value;
            }
        },

        set_value: function(value, lookup_value) {
            var new_value;
            if (this.filter_type === consts.FILTER_RANGE) {
                if (value === null) {
                    this.field.value = null;
                    this.field1.value = null;
                }
                else {
                    this.field.value = value[0];
                    this.field1.value = value[1];
                }
            }
            else {
                this.field.set_value(value, lookup_value);
            }
        },

        update: function(field) {
            var other_field = this.field,
                value;
            if (this.filter_type === consts.FILTER_RANGE) {
                if (field.value !== null) {
                    if (field === this.field) {
                        other_field = this.field1;
                    }
                    if (other_field.raw_value === null) {
                        other_field.value = field.value;
                    }
                }
            }
        },

        check_valid: function() {
            var error = this.check_value(this.field);
            if (error) {
                throw error;
            }
        },

        check_value: function(field) {
            if (this.filter_type === consts.FILTER_RANGE) {
                if (this.field.raw_value === null && this.field1.raw_value !== null ||
                    this.field.raw_value !== null && this.field1.raw_value === null ||
                    this.field.value > this.field1.value) {
                    return language.invalid_range;
                }
            }
        },

        get_text: function() {
            var result = '';
            if (this.visible && this.value != null) {
                result = this.filter_caption + ': ';
                if (this.filter_type === consts.FILTER_RANGE) {
                    result += this.field.get_display_text() + ' - ' + this.field1.get_display_text();
                }
                else if (this.field.data_type === consts.BOOLEAN) {
                    if (this.field.value) {
                        result += 'x'
                    }
                    else {
                        result += '-'
                    }
                } else {
                    result += this.field.get_display_text();
                }
            }
            return result;
        }
    };

    /**********************************************************************/
    /*                             Param class                            */
    /**********************************************************************/

    Param.prototype = new Field();
    Param.prototype.constructor = Field;

    function Param(owner, info) {
        Field.call(this, owner, info);
        this.param_name = this.field_name;
        this.param_caption = this.field_caption;
        this.field_size = 0;
        this.report = owner;
        this._value = null;
        this._lookup_value = null;
        this.field_kind = consts.PARAM_FIELD;
        if (this.owner[this.param_name] === undefined) {
            this.owner[this.param_name] = this;
        }
    }

    /**********************************************************************/
    /*                            DBTree class                            */
    /**********************************************************************/

    function DBTree(item, container, parent_field, text_field, parent_of_root_value, options) {
        this.init(item, container, parent_field, text_field, parent_of_root_value, options);
    }

    DBTree.prototype = {
        constructor: DBTree,

        init: function(item, container, options) {
            var self = this,
                default_options = {
                    id_field: undefined,
                    parent_field: undefined,
                    text_field: undefined,
                    parent_of_root_value: undefined,
                    text_tree: undefined,
                    on_click: undefined,
                    on_dbl_click: undefined
                };
            this.id = item.task.controlId++;
            this.item = item;
            this.$container = container;
            this.options = $.extend({}, default_options, options);
            this.$element = $('<div class="dbtree ' + this.item.item_name + '" tabindex="0" style="overflow-x:auto; overflow-y:auto;"></div>')
            this.$element.css('position', 'relative');
            this.$element.data('tree', this);
            this.$element.tabindex = 0;
            this.item.controls.push(this);
            this.$element.bind('destroyed', function() {
                self.item.controls.splice(self.item.controls.indexOf(self), 1);
            });
            this.$element.appendTo(this.$container);
            this.height(container.height());
            this.$element.on('focus blur', function(e) {
                self.select_node(self.selected_node, false);
            });
            this.$element.on('keyup', function(e) {
                self.keyup(e);
            })
            this.$element.on('keydown', function(e) {
                self.keydown(e);
            })
            if (item._get_active() && this.$container.width()) {
                this.build();
            }
        },

        form_closing: function() {
            var $modal = this.$element.closest('.modal');
            if ($modal) {
                return $modal.data('_closing')
            }
            return false;
        },

        height: function(value) {
            if (value) {
                this.$element.height(value);
            } else {
                return this.$element.height();
            }
        },

        is_focused: function() {
            return this.$element.get(0) === document.activeElement;
        },

        scroll_into_view: function() {
            this.select_node(this.selected_node);
        },

        update: function(state) {
            var recNo,
                self = this,
                row;
            if (this.form_closing()) {
                return;
            }
            switch (state) {
                case consts.UPDATE_OPEN:
                    this.build();
                    break;
                case consts.UPDATE_CANCEL:
                    this.changed();
                    break;
                case consts.UPDATE_APPEND:
                    this.changed();
                    break;
                case consts.UPDATE_INSERT:
                    this.changed();
                    break;
                case consts.UPDATE_DELETE:
                case consts.UPDATE_DELETE:
                    this.changed();
                    break;
                case consts.UPDATE_SCROLLED:
                    this.syncronize();
                    break;
                case consts.UPDATE_CONTROLS:
                    this.build();
                    break;
                case consts.UPDATE_CLOSE:
                    this.$element.empty();
                    break;
            }
        },

        keydown: function(e) {
            var self = this,
                $li,
                code = (e.keyCode ? e.keyCode : e.which);
            if (this.selected_node && !e.ctrlKey && !e.shiftKey) {
                switch (code) {
                    case 13: //return
                        e.preventDefault();
                        this.toggle_expanded(this.selected_node);
                        break;
                    case 38: //up
                        e.preventDefault();
                        $li = this.selected_node.prev();
                        if ($li.length) {
                            this.select_node($li);
                        } else {
                            $li = this.selected_node.parent().parent()
                            if ($li.length && $li.prop("tagName") === "LI") {
                                this.select_node($li);
                            }
                        }
                        break;
                    case 40: //down
                        e.preventDefault();
                        if (this.selected_node.hasClass('parent') && !this.selected_node.hasClass('collapsed')) {
                            $li = this.selected_node.find('ul:first li:first')
                            if ($li.length) {
                                this.select_node($li);
                            }
                        } else {
                            $li = this.selected_node.next();
                            if ($li.length) {
                                this.select_node($li);
                            } else {
                                $li = this.selected_node.find('ul:first li:first')
                                if ($li.length) {
                                    this.select_node($li);
                                }
                            }
                        }
                        break;
                }
            }
        },

        keyup: function(e) {
            var self = this,
                code = (e.keyCode ? e.keyCode : e.which);
            if (!e.ctrlKey && !e.shiftKey) {
                switch (code) {
                    case 13:
                        break;
                    case 38:
                        break;
                    case 40:
                        break;
                }
            }
        },

        build_child_nodes: function(tree, nodes) {
            var i = 0,
                len = nodes.length,
                node,
                id,
                text,
                rec,
                bullet,
                parent_class,
                collapsed_class,
                li,
                ul,
                info,
                children,
                child_len;
            for (i = 0; i < len; i++) {
                node = nodes[i];
                id = node.id;
                text = node.text;
                rec = node.rec;
                bullet = '<span class="empty-bullet"></span>',
                    parent_class = "",
                    collapsed_class = "",
                    children = this.child_nodes[id + ''];
                if (children && children.length) {
                    bullet = '<i class="icon-chevron-right bullet"></i>'
                    parent_class = ' parent';
                    collapsed_class = 'collapsed';
                }
                li = '<li class="' + collapsed_class + parent_class + '" style="list-style: none" data-rec="' + rec + '">' +
                    '<div><span class="tree-bullet">' + bullet + '</span>' +
                    '<span class="tree-text">' + text + '<span></div>';
                tree += li;
                if (children && children.length) {
                    tree += '<ul style="display: none">';
                    tree = this.build_child_nodes(tree, children);
                    tree += '</ul>';
                }
                tree += '</li>';
                tree += '</li>';
            }
            return tree
        },

        collect_nodes: function(clone) {
            var id_field = clone[this.options.id_field],
                parent_field = clone[this.options.parent_field],
                text_field = clone[this.options.text_field],
                array;
            this.child_nodes = {};
            clone.first();
            while (!clone.eof()) {
                array = this.child_nodes[parent_field.value + ''];
                if (array === undefined) {
                    array = []
                    this.child_nodes[parent_field.value + ''] = array;
                }
                array.push({
                    'id': id_field.value,
                    'text': text_field.display_text,
                    'rec': clone.rec_no
                });
                clone.next();
            }
        },

        build: function() {
            var self = this,
                clone = this.item.clone(),
                tree = '<ul>',
                i,
                len,
                rec,
                info,
                $li,
                $lis,
                nodes;
            clone.on_field_get_text = this.item.on_field_get_text;
            this.collect_nodes(clone);
            this.$element.empty();
            nodes = this.child_nodes[this.options.parent_of_root_value + ''];
            if (nodes && nodes.length) {
                tree = this.build_child_nodes(tree, nodes);
            }
            tree += '</ul>'
            this.$element.append($(tree));
            $lis = this.$element.find('li');
            len = $lis.length;
            for (i = 0; i < len; i++) {
                $li = $lis.eq(i);
                rec = $li.data('rec');
                clone._set_rec_no(rec);
                this.item._cur_row = rec;
                $li.data("record", clone._dataset[rec]);
                info = clone.rec_controls_info();
                info[this.id] = $li.get(0);
                if (this.options.node_callback) {
                    this.options.node_callback($li, this.item);
                }
            }
            this.select_node($lis.eq(0));

            this.$element.off('click', 'li.parent > div span.tree-bullet');
            this.$element.on('click', 'li.parent > div span.tree-bullet', function(e) {
                var $span = $(this),
                    $li = $span.parent().parent(),
                    $ul;
                self.toggle_expanded($li);
                e.preventDefault();
                e.stopPropagation();
            });
            this.$element.off('click', 'li > div span.tree-text');
            this.$element.on('click', 'li > div span.tree-text', function(e) {
                var $li = $(this).parent().parent();
                self.select_node($li);
            });
        },

        toggle_expanded: function($li) {
            var $span = $li.find('div:first span.tree-bullet'),
                $ul;
            if ($li.hasClass('parent')) {
                $ul = $li.find('ul:first'),
                    $li.toggleClass('collapsed');
                if ($li.hasClass('collapsed')) {
                    $span.html('<i class="icon-chevron-right bullet"></i>');
                } else {
                    $span.html('<i class="icon-chevron-down bullet"></i>');
                }
                $ul.slideToggle(0);
            }
        },

        expand: function($li) {
            if ($li.hasClass('parent') && $li.hasClass('collapsed')) {
                this.toggle_expanded($li);
            }
            $li = $li.parent().parent()
            if ($li.prop("tagName") === "LI") {
                this.expand($li);
            }
        },

        collapse: function($li) {
            if ($li.hasClass('parent') && !$li.hasClass('collapsed')) {
                this.toggle_expanded($li);
            }
        },

        select_node: function($li, update_node) {
            var self = this,
                $parent,
                rec;
            if (update_node === undefined) {
                update_node = true;
            }
            if (this.selected_node) {
                this.selected_node.removeClass('selected selected-focused');
            }
            if ($li && (!this.selected_node || $li.get(0) !== this.selected_node.get(0))) {
                this.selected_node = $li;
                rec = this.item._dataset.indexOf($li.data("record"));
                if (rec !== this.item.rec_no) {
                    this.item._set_rec_no(rec);
                }
                $parent = this.selected_node.parent().parent()
                if ($parent.prop("tagName") === "LI") {
                    this.expand($parent);
                }
            }
            if (this.is_focused()) {
                this.selected_node.addClass('selected-focused');
            } else {
                this.selected_node.addClass('selected');
            }
            if (update_node) {
                this.update_selected_node(this.selected_node);
            }
        },

        update_selected_node: function($li) {
            var containerTop,
                containerBottom,
                elemTop,
                elemBottom,
                parent;
            if ($li.length) {
                containerTop = this.$element.scrollTop();
                containerBottom = containerTop + this.$element.height();
                elemTop = $li.get(0).offsetTop;
                elemBottom = elemTop + $li.height();
                if (elemTop < containerTop) {
                    this.$element.scrollTop(elemTop);
                } else if (elemBottom > containerBottom) {
                    this.$element.scrollTop(elemBottom - this.$element.height());
                }
            }
        },

        update_field: function() {
        },

        syncronize: function() {
            var info,
                $li;
            if (this.item.record_count()) {
                try {
                    info = this.item.rec_controls_info(),
                        $li = $(info[this.id]);
                    this.select_node($li);
                } catch (e) {
                    console.log(e);
                }
            }
        },

        changed: function() {},
    }

    /**********************************************************************/
    /*                            DBTable class                           */
    /**********************************************************************/

    function DBTable(item, container, options, master_table) {
        this.init(item, container, options, master_table);
    }

    DBTable.prototype = {
        constructor: DBTable,

        init: function(item, container, options, master_table) {
            var self = this;

            if (!container.length) {
                return;
            }
            this.item = item;
            this.id = item.task.gridId++;
            this.$container = container;
            this.$container.css('position', 'relative');
            this.master_table = master_table;

            this.editMode = false;
            this._sorted_fields = [];
            this._multiple_sort = false;
            this.page = 0;
            this.record_count = 0;
            this.cellWidths = {};
            this.auto_field_width = true;
            this.scrollLeft = 0;
            this.field_width_updated = false;

            this.init_options(options);
            this.init_selections();
            this.init_fields();

            this.$element = $('<div class="dbtable">');

            this.$element.addClass(item.item_name);
            this.$element.append($('<div class="table-container" style="overflow-x:auto;">'));
            this.$element.append($('<div class="paginator text-center">'));

            if (this.options.table_class) {
                this.$element.addClass(this.options.table_class);
            }
            this.$element.data('dbtable', this);
            this.item.controls.push(this);

            this.resize_id = 'resize.dbtable-' + this.item.item_name + this.id;
            if (this.master_table) {
                this.$element.addClass('freezed');
                this.resize_id = 'resize.dbtable.freezed-' + this.item.item_name + this.id;
            }
            $(window).on(this.resize_id, function() {
                clearTimeout(self.timeOut);
                self.timeOut = setTimeout(
                    function() {
                        if (self.master_table && !self.master_table.freezed_table) {
                            return;
                        }
                        self.build();
                        self.sync_freezed();
                    },
                    50
                );
            });
            this.$element.bind('destroyed', function() {
                $(window).off(self.resize_id);
                self.item.controls.splice(self.item.controls.indexOf(self), 1);
            });

            this.$container.empty();
            this.$element.appendTo(this.$container);
            this.createTable();
            this.create_pager();

            this.sync_freezed();

            if (item._get_active()) {
                self.do_after_open();
            }
        },

        ids_to_field_names: function(ids) {
            var i,
                field,
                result;
            if (ids && ids.length) {
                result = [];
                for (i = 0; i < ids.length; i++) {
                    field = this.item._field_by_ID(ids[i]);
                    if (field) {
                        result.push(field.field_name);
                    }
                }
            }
            return result;
        },

        init_options: function(options) {
            var default_options = {
                table_class: undefined,
                //~ pagination: false,
                multiselect: false,
                height: undefined,
                row_count: undefined,
                fields: [],
                column_width: {},
                title_word_wrap: false,
                row_line_count: 1,
                expand_selected_row: 0,
                selections: undefined,
                select_all: true,
                selection_limit: undefined,
                tabindex: 0,
                striped: true,
                dblclick_edit: true,
                on_click: undefined,
                on_dblclick: undefined,
                on_pagecount_update: undefined,
                on_page_changed: undefined,
                editable: false,
                editable_fields: undefined,
                keypress_edit: true,
                selected_field: undefined,
                append_on_lastrow_keydown: false,
                sortable: false,
                sort_fields: undefined,
                sort_add_primary: false,
                row_callback: undefined,
                title_callback: undefined,
                summary_fields: [],
                show_footer: undefined,
                show_paginator: true,
                paginator_container: undefined,
                freeze_count: 0,
                hide_y_scroll: true
            };

            this.options = $.extend(true, {}, default_options, this.item.table_options);
            this.options = $.extend({}, this.options, options);
            if (!this.item._paginate) {
                default_options.striped = false;
            }
            if (this.options.row_count) {
                this.options.height = undefined;
            }
            if (!this.options.height && !this.options.row_count) {
                this.options.height = 480;
            }
            if (this.options.row_line_count < 1) {
                this.options.row_line_count = 0;
                this.options.hide_y_scroll = false;
            }
            if (this.item.master) {
                this.options.select_all = false;
            }
            if (this.options.summary_fields && this.options.summary_fields.length) {
                this.options.show_footer = true
            }
            this.on_dblclick = this.options.on_dblclick;
        },

        init_fields: function() {
            var i = 0,
                len,
                field,
                fields = [];
            this.fields = [];
            if (this.options.fields.length) {
                fields = this.options.fields
            } else if (this.item.view_options.fields && this.item.view_options.fields.length) {
                fields = this.item.view_options.fields;
            } else if (!fields.length) {
                this.item.each_field(function(f) {
                    if (f.field_name !== f.owner._primary_key && f.field_name !== f.owner._deleted_flag) {
                        fields.push(f.field_name);
                    }
                });
            }
            if (fields.length) {
                len = fields.length;
                for (i = 0; i < len; i++) {
                    field = this.item.field_by_name(fields[i]);
                    if (field) {
                        this.fields.push(field);
                    }
                }
            }
            //~ this.options.editable = this.options.editable && !this.item.read_only;
            if (this.options.editable) {
                this.options.striped = false;
            }
            this.editableFields = [];
            if (this.options.editable_fields) {
                len = this.fields.length;
                for (i = 0; i < len; i++) {
                    if (!this.fields[i].read_only) {
                        if (this.options.editable_fields.indexOf(this.fields[i].field_name) !== -1) {
                            this.editableFields.push(this.fields[i]);
                        }
                    }
                }
            } else {
                len = this.fields.length;
                for (i = 0; i < len; i++) {
                    if (!this.fields[i].read_only) {
                        this.editableFields.push(this.fields[i]);
                    }
                }
            }
            this.initSelectedField();
            this.colspan = this.fields.length;
            if (this.options.multiselect) {
                this.colspan += 1;
            }
        },

        can_edit: function() {
            if (this.item.read_only) {
                return false;
            }
            if (this.item.master && !this.item.master.is_changing()) {
                return false;
            }
            return this.options.editable;
        },

        get_freezed_fields: function(len) {
            var i,
                result = [];
            if (!len) {
                len = this.options.freeze_count;
            }
            for (i = 0; i < len; i++) {
                result.push(this.fields[i].field_name);
            }
            return result;
        },

        create_freezed_table: function() {
            var i,
                options,
                container;
            options = $.extend({}, this.options)
            options.show_paginator = false;
            options.fields = [];
            options.freeze_count = 0;
            options.fields = this.get_freezed_fields();
            container = $('<div>')
            this.freezed_table = new DBTable(this.item, container, options, this)
            this.freezed_table.$element.detach()
            this.freezed_table.$element.css('position', 'absolute');
            this.freezed_table.$element.css('left', '0');
            this.freezed_table.$element.css('top', '0');
            this.freezed_table.$element.css('overflow', 'hidden');
            this.freezed_table.$table_container.css('overflow', 'hidden');
            this.freezed_table.$outer_table.css('overflow', 'hidden');
            this.freezed_table.$scroll_div.css('overflow', 'hidden');

            this.freezed_table.$container = this.$container;
            this.$container.append(this.freezed_table.$element);
        },

        delete_freezed_table: function() {
            this.freezed_table.$element.remove();
            delete this.freezed_table
            this.freezed_table = undefined;
        },

        sync_freezed: function() {
            var i,
                col,
                $th,
                $td,
                $tf,
                cell_width,
                field_name,
                fields1,
                fields2,
                valid_fields,
                scroll_left,
                title_height,
                width;
            if (this.options.freeze_count) {
                if (this.freezed_table) {
                    fields1 = this.get_freezed_fields();
                    fields2 = this.freezed_table.get_freezed_fields(this.options.freeze_count);
                    valid_fields = fields1.length === fields2.length;
                    if (valid_fields) {
                        for (i = 0; i < fields1.length; i++) {
                            if (fields1[i] !== fields2[i]) {
                                valid_fields = false;
                                break;
                            }
                        }
                    }
                    if (!valid_fields) {
                        this.delete_freezed_table();
                    }
                }
                if (this.$scroll_div.get(0).scrollWidth > this.$element.innerWidth()) {
                    if (!this.freezed_table) {
                        this.create_freezed_table();
                    }
                    col = this.options.freeze_count - 1;
                    if (this.options.multiselect) {
                        col += 1;
                    }
                    $th = this.$head.find('th').eq(col);
                    scroll_left = this.$element.find('.table-container')[0].scrollLeft;
                    width = scroll_left + ($th.position().left + $th.outerWidth(true) + 1);

                    this.freezed_table.$element.width(width);
                }
                else if (this.freezed_table) {
                    this.delete_freezed_table();
                }
            }
            else {
                if (this.master_table) {
                    this.$outer_table.find('thead tr').height(this.master_table.$outer_table.find('thead tr').height());
                    for (i = 0; i < this.fields.length - 1; i++) {
                        field_name = this.fields[i].field_name;
                        cell_width = this.master_table.getCellWidth(field_name);
                        this.setCellWidth(field_name, cell_width);
                        $td = this.$table.find('td.' + field_name);
                        $th = this.$element.find("thead tr:first th." + field_name);
                        $tf = this.$element.find("tfoot tr:first th." + field_name);
                        $td.width(cell_width);
                        $td.find('div').width(cell_width);
                        $th.width(cell_width);
                        $th.find('div').width(cell_width);
                        $tf.width(cell_width);
                        $tf.find('div').width(cell_width);
                    }
                    this.syncColWidth();
                }
            }
        },

        init_selections: function() {
            var value;
            if (this.options.multiselect && !this.item.selections) {
                this.item.selections = [];
            }
            if (this.item.selections) {
                this.options.multiselect = true;
            }
            if (this.options.selections && this.options.selections.length) {
                this.item.selections = this.options.selections;
                this.options.multiselect = true;
            }
            if (this.item.lookup_field && this.item.lookup_field.multi_select) {
                value = this.item.lookup_field.raw_value;
                this.options.select_all = this.item.lookup_field.multi_select_all;
                if (value instanceof Array) {
                    this.item.selections = value;
                }
                else {
                    this.item.selections = [];
                }
                this.options.multiselect = true;
            }
            this.item.select_all = this.options.select_all;
        },

        selections_update_selected: function() {
            var sel_count = this.$element.find('th .multi-select .sel-count');
            if (this.options.multiselect) {
                sel_count.text(this.item.selections.length);
                if (this.item.show_selected) {
                    sel_count.addClass('selected-shown')
                }
                else {
                    sel_count.removeClass('selected-shown')
                }
                if (this.item.lookup_field && this.item.lookup_field.multi_select) {
                    if (this.item.selections.length === 1 && this.item._primary_key_field && this.item.selections.indexOf(this.item._primary_key_field.value) !== -1) {
                        this.item.lookup_field.set_value(this.item.selections, this.item.field_by_name(this.item.lookup_field.lookup_field).display_text);
                    }
                    else {
                        this.item.lookup_field.set_value(this.item.selections, '');
                    }
                }
            }
        },

        selections_get_selected: function() {
            return this.item.selections.indexOf(this.item._primary_key_field.value) !== -1;
        },

        selections_can_change: function(value) {
            var valid = true;
            if (value && this.options.selection_limit) {
                valid = (this.options.selection_limit &&
                    this.options.selection_limit >= this.item.selections.length + 1);
                if (!valid) {
                    this.item.warning(language.selection_limit_exceeded.replace('%s', this.options.selection_limit))
                }
            }
            return valid;
        },

        selections_set_selected: function(value) {
            var self = this,
                result = value,
                index,
                clone,
                selected = false;
            if (this.selections_can_change(value)) {
                if (value) {
                    this.item.selections.add(this.item._primary_key_field.value);
                    selected = true;
                } else {
                    this.item.selections.remove(this.item._primary_key_field.value)
                    clone = this.item.clone();
                    clone.each(function(c) {
                        if (self.item.selections.indexOf(c._primary_key_field.value) !== -1) {
                            selected = true;
                            return false;
                        }
                    })
                }
                this.selections_update_selected();
                this.$element.find('input.multi-select-header').prop('checked', selected);
            }
            else {
                result = false;
            }
            return result;
        },

        selections_get_all_selected: function() {
            var self = this,
                clone = this.item.clone(),
                result = false;
            clone.each(function(c) {
                if (self.item.selections.indexOf(c._primary_key_field.value) !== -1) {
                    result = true;
                    return false;
                }
            })
            return result;
        },

        selections_set_all_selected_ex: function(value) {
            var self = this,
                i,
                field,
                fields = [],
                limit,
                exceeded,
                mess,
                copy,
                clone;
            if (this.options.select_all) {
                copy = this.item.copy({handlers: false})
                copy._where_list = this.item._open_params.__filters;
                copy._order_by_list = this.item._open_params.__order;
                if (this.options.selection_limit) {
                    limit = this.options.selection_limit;// - this.item.selections.length;
                }
                fields.push(copy._primary_key);
                for (i = 0; i < copy._where_list.length; i++) {
                    field = this.item.field_by_name(copy._where_list[i][0]);
                    if (field.lookup_item) {
                        fields.push(field.field_name);
                    }
                }
                for (i = 0; i < copy._order_by_list.length; i++) {
                    field = this.item.field_by_ID(copy._order_by_list[i][0]);
                    if (fields.indexOf(field.field_name) === -1) {
                        fields.push(field.field_name);
                    }
                }
                copy.open({fields: fields, limit: limit}, function() {
                    var dict = {}, sel = [];
                    for (i = 0; i < self.item.selections.length; i++) {
                        dict[self.item.selections[i]] = true;
                    }
                    self.item.selections.length = 0;
                    copy.each(function(c) {
                        if (value) {
                            dict[c._primary_key_field.value] = true;
                        }
                        else {
                            delete dict[c._primary_key_field.value];
                        }
                    });
                    for (var id in dict) {
                        sel.push(parseInt(id, 10))
                        //~ self.item.selections.add(parseInt(id, 10));
                    }
                    self.item.selections = sel;
                    self.$table.find('td input.multi-select').prop('checked', value);
                    self.$element.find('input.multi-select-header').prop('checked',
                        self.selections_get_all_selected());
                    self.selections_update_selected();
                })
            }
        },

        selections_set_all_selected: function(value) {
            var self = this,
                i,
                field,
                fields = [],
                limit,
                exceeded,
                mess,
                copy,
                clone;
            clone = this.item.clone();
            clone.each(function(c) {
                var index;
                if (self.selections_can_change(value)) {
                    if (value) {
                        self.item.selections.add(c._primary_key_field.value);
                    } else {
                        self.item.selections.remove(c._primary_key_field.value);
                    }
                }
                else {
                    exceeded = true;
                    return false;
                }
            })
            if (exceeded) {
                this.build();
            }
            else {
                self.$table.find('td input.multi-select').prop('checked', value);
            }
            this.selections_update_selected();
        },

        initKeyboardEvents: function() {
            var self = this,
                timeOut;
            clearTimeout(timeOut);
            timeOut = setTimeout(function() {
                    self.$table.on('keydown', function(e) {
                        self.keydown(e);
                    });

                    self.$table.on('keyup', function(e) {
                        self.keyup(e);
                    });

                    self.$table.on('keypress', function(e) {
                        self.keypress(e);
                    });
                },
                300
            );
        },

        createTable: function() {
            var self = this,
                $doc = $(document),
                $selection,
                $th,
                $td,
                $thNext,
                delta = 0,
                mouseX;
            this.colspan = this.fields.length;
            if (this.options.multiselect) {
                this.colspan += 1;
            }
            this.$element.find('.table-container').append($(
                '<table class="outer-table" style="width: 100%;">' +
                '   <thead>' +
                '       <tr><th>&nbsp</th></tr>' +
                '   </thead>' +
                '   <tr>' +
                '       <td id="top-td" style="padding: 0;" colspan=' + this.colspan + '>' +
                '           <div class="overlay-div" style="width: 100%; overflow-y: auto; overflow-x: hidden;">' +
                '               <table class="inner-table" style="width: 100%"></table>' +
                '           </div>' +
                '       </td>' +
                '   </tr>' +
                '   <tfoot class="outer-table">' +
                '       <tr><th>&nbsp</th></tr>' +
                '   </tfoot>' +
                '</table>'));

            this.$table_container = this.$element.find(".table-container")
            this.$outer_table = this.$element.find("table.outer-table")
            this.$scroll_div = this.$element.find('div.overlay-div');
            this.$table = this.$element.find("table.inner-table");
            this.$head = this.$element.find("table.outer-table thead tr:first");
            this.$foot = this.$element.find("table.outer-table tfoot tr:first");
            this.is_modal = this.$element.closest('.modal').length > 0;

            if (this.item._paginate && this.options.hide_y_scroll) {
                this.$scroll_div.css('overflow-y', 'hidden');
            }

            this.$scroll_div.keydown(function(e) {
                var code = (e.keyCode ? e.keyCode : e.which);
                if (code == 32 && !self.editing) {
                    e.preventDefault();
                }
            })

            this.$element.find('table.outer-table')
                .addClass("table table-condensed table-bordered")
                .css("margin", 0);

            this.$table.addClass("table table-condensed")
                .css("margin", 0)
                .attr("disabled", false);
            if (this.options.striped) {
                this.$table.addClass("table-striped");
            }

            this.$table.on('mousedown dblclick', 'td', function(e) {
                var td = $(this);
                if (this.nodeName !== 'TD') {
                    td = $(this).closest('td');
                }
                if (!(self.editing && td.find('input').length)) {
                    e.preventDefault();
                    e.stopPropagation();
                    self.clicked(e, td);
                }
            });

            this.$element.on('mousewheel DOMMouseScroll', 'div.overlay-div, table.inner-table', function(e){
                e.preventDefault();
                e.stopPropagation();
                if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
                    self.prior_record();
                }
                else {
                    self.next_record();
                }
            });

            this.$table.on('click', 'td', function(e) {
                if (self.options.on_click) {
                    self.options.on_click.call(self.item, self.item);
                }
            });

            this.$table.on('mouseenter mouseup', 'td div', function() {
                var $this = $(this),
                    $td = $this.parent(),
                    tt = $this.data('tooltip'),
                    placement = 'right',
                    container = this.closest('.dbtable');
                self._remove_tooltip();
                if (Math.abs(this.offsetHeight - this.scrollHeight) > 1 ||
                    Math.abs(this.offsetWidth - this.scrollWidth) > 1) {
                    if (self.$table.width() - ($this.position().left + $this.width()) < 200) {
                        placement = 'left';
                    }
                    $td.tooltip({
                            'placement': placement,
                            'container': container,
                            //~ 'container': 'body',
                            'title': $this.text()
                        })
                        .on('hide hidden show shown', function(e) {
                            if (e.target === $this.get(0)) {
                                e.stopPropagation()
                            }
                        })
                        .eq(0).tooltip('show');
                    try {
                        $td.data('tooltip').$tip.addClass('table-tooltip');
                    }
                    catch (e) {}
                }
            });

            this.$table.on('mousedown', 'td input.multi-select', function(e) {
                var $this = $(this),
                    checked = $this.is(':checked');
                self.clicked(e, $this.closest('td'));
                self.selections_set_selected(!checked);
                $this.prop('checked', self.selections_get_selected());
            });

            this.$table.on('click', 'td input.multi-select', function(e) {
                var $this = $(this);
                e.stopPropagation();
                e.preventDefault();
                $this.prop('checked', self.selections_get_selected());
            });

            this.$element.on('click', 'input.multi-select-header', function(e) {
                self.selections_set_all_selected($(this).is(':checked'));
            });

            this.$table.attr("tabindex", this.options.tabindex);

            this.initKeyboardEvents();

            this.$element.on('mousemove.grid-title', 'table.outer-table thead tr:first th', function(e) {
                var $this = $(this),
                    field_name = $this.data('field_name'),
                    lastCell = self.$element.find("thead tr:first th:last").get(0);
                if ($this.outerWidth() - e.offsetX < 8 && !mouseX && (this !== lastCell || self.master_table)) {
                    $this.css('cursor', 'col-resize');
                } else if (self.options.sortable && //!self.item.master &&
                    (!self.options.sort_fields || self.options.sort_fields.indexOf(field_name) !== -1)) {
                    $this.css('cursor', 'pointer');
                } else {
                    $this.css('cursor', 'default');
                }
            });

            function captureMouseMove(e) {
                var newDelta = delta + e.screenX - mouseX,
                    left = parseInt($selection.css("left"), 10);
                if (mouseX) {
                    e.preventDefault();
                    if (newDelta > -($th.innerWidth() - 30)) {
                        delta = newDelta;
                        $selection.css('left', left + e.screenX - mouseX);
                    }
                    mouseX = e.screenX;
                }
            }

            function changeFieldWidth($title, delta) {
                var i,
                    field_name,
                    fields,
                    $td,
                    $th,
                    $tf,
                    lastCell = self.$element.find("thead tr:first th:last").get(0),
                    width,
                    oldCellWidth,
                    cellWidth;
                field_name = $title.data('field_name');
                $td = self.$table.find('td.' + field_name);
                $tf = self.$element.find("tfoot tr:first th." + field_name);
                oldCellWidth = self.getCellWidth(field_name);
                cellWidth = oldCellWidth + delta;

                self.setCellWidth(field_name, cellWidth);

                if (self.master_table) {
                    self.$element.width(self.$element.width() + delta)
                    self.master_table.setCellWidth(field_name, cellWidth);
                    $td = self.master_table.$table.find('td.' + field_name);
                    $th = self.master_table.$element.find("thead tr:first th." + field_name);
                    $tf = self.master_table.$element.find("tfoot tr:first th." + field_name);
                    $td.width(cellWidth);
                    $td.find('div').width(cellWidth);
                    $th.width(cellWidth);
                    $th.find('div').width(cellWidth);
                    $tf.width(cellWidth);
                    $tf.find('div').width(cellWidth);
                    self.master_table.syncColWidth();
                    self.master_table.sync_freezed();
                }
                else {
                    $td.width(cellWidth);
                    $td.find('div').width(cellWidth);
                    $title.width(cellWidth);
                    $title.find('div').width(cellWidth);
                    $tf.width(cellWidth);
                    $tf.find('div').width(cellWidth);
                    self.syncColWidth();
                }
                self.sync_freezed();
            }

            function releaseMouseMove(e) {
                var field_name,
                    $td,
                    $tf,
                    cellWidth;
                $doc.off("mousemove.grid-title");
                $doc.off("mouseup.grid-title");

                changeFieldWidth($th, delta);

                mouseX = undefined;
                $selection.remove()
            }

            this.$element.on('mousedown.grid-title', 'table.outer-table thead tr:first th', function(e) {
                var $this = $(this),
                    index,
                    lastCell,
                    field_name = $this.data('field_name'),
                    cur_field_name,
                    field_ID,
                    new_fields = [],
                    index,
                    desc = false,
                    next_field_name,
                    field,
                    parent,
                    top,
                    left,
                    sorted_fields;
                lastCell = self.$element.find("thead tr:first th:last").get(0);
                if ($this.outerWidth() - e.offsetX < 8 && (this !== lastCell || self.master_table)) {
                    $this.css('cursor', 'default');
                    mouseX = e.screenX;
                    $th = $this;
                    index = self.fields.indexOf(self.item.field_by_name(field_name))
                    delta = 0;
                    $doc.on("mousemove.grid-title", captureMouseMove);
                    $doc.on("mouseup.grid-title", releaseMouseMove);
                    parent = self.$container.closest('.modal');
                    if (parent.length) {
                        left = $this.offset().left - parent.offset().left;
                        top = self.$element.offset().top - parent.offset().top;
                    }
                    else {
                        parent = $('body');
                        left = $this.offset().left;
                        top = self.$element.offset().top;
                    }
                    $selection = $('<div>')
                        .addClass('selection-box')
                        .css({
                            'width': 0,
                            'height': self.$outer_table.find('thead').innerHeight() + self.$scroll_div.innerHeight(),
                            'left': left + $this.outerWidth(),
                            'top': top
                        });

                    $selection.appendTo(parent);
                } else if (field_name && self.options.sortable &&
                    (!self.options.sort_fields.length || self.options.sort_fields.indexOf(field_name) !== -1)) {

                    if (e.ctrlKey) {
                        if (!self._multiple_sort) {
                            self._multiple_sort = true;
                        }
                    } else {
                        if (self._multiple_sort) {
                            self._sorted_fields = [];
                            self._multiple_sort = false;
                        }
                    }
                    field_ID = self.item.field_by_name(field_name).ID;
                    sorted_fields = self._sorted_fields.slice();
                    if (self._multiple_sort) {
                        index = -1;
                        for (var i = 0; i < sorted_fields.length; i++) {
                            if (sorted_fields[i][0] === field_ID) {
                                index = i;
                                break;
                            }
                        }
                        if (index === -1) {
                            sorted_fields.push([field_ID, false])
                        } else {
                            sorted_fields[index][1] = !sorted_fields[index][1];
                        }
                    } else {
                        if (sorted_fields.length && sorted_fields[0][0] === field_ID) {
                            sorted_fields[0][1] = !sorted_fields[0][1];
                        } else {
                            sorted_fields = [
                                [field_ID, false]
                            ];
                        }
                    }
                    self._sorted_fields = sorted_fields.slice();
                    if (self.item.master || !self.item._paginate) {
                        self.item._sort(self._sorted_fields);
                    } else {
                        if (self.options.sort_add_primary) {
                            field = self.item[self.item._primary_key]
                            desc = self._sorted_fields[self._sorted_fields.length - 1][1]
                            self._sorted_fields.push([field.ID, desc]);
                        }
                        self.item._open_params.__order = self._sorted_fields;
                        self.item.open({
                            params: self.item._open_params,
                            offset: 0
                        }, true);
                    }
                }
            });

            this.$table.focus(function(e) {
                if (!this.syncronizing) {
                    this.syncronizing = true;
                    try {
                        self.syncronize();
                    } finally {
                        this.syncronizing = false;
                    }
                }
            });

            this.$table.blur(function(e) {
                self.syncronize();
            });

            this.fill_footer();
            this.calculate();
        },

        _remove_tooltip: function() {
            try {
                $('body').find('.tooltip.table-tooltip').remove();
            }
            catch (e) {}
        },

        calculate: function() {
            var i,
                row_line_count,
                $element,
                $table,
                row,
                $td,
                margin,
                fix,
                row_height,
                elementHeight,
                scrollDivHeight;
            row_line_count  = this.options.row_line_count
            if (!row_line_count) {
                row_line_count = 1;
            }
            if (this.master_table) {
                this.row_count = this.master_table.row_count;
                this.text_height = this.master_table.text_height;
                this.row_height = this.master_table.row_height;
                this.selected_row_height = this.master_table.selected_row_height;

                this.height(this.master_table.height());
                this.$scroll_div.height(this.master_table.$scroll_div.height());
                return;
            }
            $element = this.$element.clone()
                .css("float", "left")
                .css("position", "absolute")
                //~ .css("top", 0);
                .css("top", -1000);
            $element.width(this.$container.width());
            if (!$element.width()) {
                $element.width($('body').width());
            }
            this.fill_title($element);
            this.fill_footer($element);
            this.create_pager($element)
            $table = $element.find("table.inner-table");
            if (this.item.selections && !this.item.master) {
                row = '<tr><td><div><input type="checkbox"></div></td><td><div>W</div></td></tr>';
            } else {
                row = '<tr><td><div>W</div></td></tr>';
            }
            for (i = 0; i < 10; i++) {
                $table.append(row);
            }
            $element.find('th > div > p').css('margin', 0);
            $('body').append($element);
            $td = $table.find('tr:last td');
            this.text_height = $td.find('div').height();
            row_height = $td.outerHeight(true);
            margin = row_height * 10 - $table.innerHeight();
            fix = Math.abs(Math.abs(margin) - 10); // fix for firebird
            if (fix && fix < 5 && margin < 0) {
                row_height += Math.round(fix);
                margin = row_height * 10 - $table.innerHeight();
            }
            this.row_height = row_height + (row_line_count - 1) * this.text_height;
            this.selected_row_height = 0;
            elementHeight = $element.outerHeight();
            scrollDivHeight = $element.find('div.overlay-div').innerHeight();
            $element.remove();
            if (this.options.expand_selected_row) {
                this.selected_row_height = row_height + (this.options.expand_selected_row - 1) * this.text_height;
            }
            if (this.options.row_count && this.item._paginate) {
                this.row_count = this.options.row_count;
                this.item._limit = this.options.row_count;
                this.$scroll_div.height(this.row_height * this.options.row_count);
                if (this.options.height) {
                    this.$scroll_div.height(this.options.height - (elementHeight - scrollDivHeight) - $element.find('.paginator').outerHeight(true));
                }
                return
            }
            this.$scroll_div.height(this.options.height - (elementHeight - scrollDivHeight) - $element.find('.paginator').outerHeight(true));
            if (this.options.row_count) {
                this.row_count = this.options.row_count;
                this.$scroll_div.height(this.row_height * this.options.row_count);
                if (this.options.expand_selected_row) {
                    this.$scroll_div.height(this.row_height * (this.options.row_count - 1) + this.selected_row_height + margin);
                }
            }
            if (this.item._paginate) {
                if (!this.options.row_count) {
                    scrollDivHeight = this.$scroll_div.innerHeight() + margin;
                    if (this.options.expand_selected_row) {
                        scrollDivHeight = this.$scroll_div.height() - this.selected_row_height + margin;
                    }
                    this.row_count = Math.floor(scrollDivHeight / this.row_height);
                    if (this.options.expand_selected_row) {
                        this.row_count += 1;
                    }
                    if (this.row_count <= 0) {
                        this.row_count = 1;
                    }
                }
                this.item._limit = this.row_count;
            }
        },

        create_pager: function($element) {
            var self = this,
                $pagination,
                $pager,
                tabindex,
                pagerWidth;
            if (this.item._paginate && this.options.show_paginator) {
                tabindex = -1;
                $pagination = $(
                    '   <div id="pager" style="margin: 0 auto">' +
                    '       <form class="form-inline" style="margin: 0">' +
                    '           <a class="btn btn-small" tabindex="-1" href="first"><i class="icon-backward"></i></a>' +
                    '           <a class="btn btn-small" tabindex="-1" href="prior"><i class="icon-chevron-left"></i></a>' +
                    '           <label  class="control-label" for="input-page">' + language.page + '</label>' +
                    '           <input class="pager-input input-mini" id="input-page" tabindex="' + tabindex + '" type="text">' +
                    '           <label id="page-count" class="control-label" for="input-page">' + language.of + '1000000 </label>' +
                    '           <a class="btn btn-small" tabindex="-1" href="next"><i class="icon-chevron-right"></i></a>' +
                    '           <a class="btn btn-small" tabindex="-1" href="last"><i class="icon-forward"></i></a>' +
                    '       </form>' +
                    '   </div>'
                    );


                this.$fistPageBtn = $pagination.find('[href="first"]');
                this.$fistPageBtn.on("click", function(e) {
                    self.firstPage();
                    e.preventDefault();
                });
                this.$fistPageBtn.addClass("disabled");

                this.$priorPageBtn = $pagination.find('[href="prior"]');
                this.$priorPageBtn.on("click", function(e) {
                    self.priorPage();
                    e.preventDefault();
                });
                this.$priorPageBtn.addClass("disabled");

                this.$nextPageBtn = $pagination.find('[href="next"]');
                this.$nextPageBtn.on("click", function(e) {
                    self.nextPage();
                    e.preventDefault();
                });

                this.$lastPageBtn = $pagination.find('[href="last"]');
                this.$lastPageBtn.on("click", function(e) {
                    self.lastPage();
                    e.preventDefault();
                });
                this.$pageInput = $pagination.find('input');
                this.$pageInput.val(1);
                this.$pageInput.on("keydown", function(e) {
                    var page,
                        code = (e.keyCode ? e.keyCode : e.which);
                    if (code === 13) {
                        page = parseInt(self.$pageInput.val(), 10);
                        e.preventDefault();
                        if (!isNaN(page) && (page > 0)) {
                            self.$pageInput.val(page);
                            self.set_page_number(page - 1);
                        }
                    }
                });
                this.$page_count = $pagination.find('#page-count');
                this.$page_count.text(language.of + '1000000');
                $pager = $pagination.find('#pager').clone()
                    .css("float", "left")
                    .css("position", "absolute")
                    .css("top", -1000);
                $("body").append($pager);
                pagerWidth = $pager.width();
                $pager.remove();
                if (this.options.paginator_container) {
                    this.options.paginator_container.empty();
                    this.options.paginator_container.append($pagination);
                } else {
                    if ($element) {
                        $element.find('.paginator').append($pagination);
                    } else {
                        this.$element.find('.paginator').append($pagination);
                    }
                }
                this.$page_count.text(language.of + ' ');
                $pagination.find('#pager').width(pagerWidth);
            }
        },

        initSelectedField: function() {
            var field;
            if (!this.selectedField && this.editableFields.length) {
                this.selectedField = this.editableFields[0];
                if (this.options.selected_field) {
                    field = this.item.field_by_name(this.options.selected_field);
                    if (this.editableFields.indexOf(field) !== -1) {
                        this.selectedField = field;
                    }
                }
            }
        },

        setSelectedField: function(field) {
            var self = this,
                fieldChanged = this.selectedField !== field;
            if (this.editableFields.indexOf(field) !== -1) {
                if (fieldChanged && this.can_edit()) {
                    this.flush_editor();
                    this.hide_editor();
                }
                this.hide_selection();
                this.selectedField = field
                if (this.can_edit() && fieldChanged && this.editMode) {
                    clearTimeout(this.editorsTimeOut);
                    this.editorsTimeOut = setTimeout(function() {
                            self.show_editor();
                        },
                        75);
                }
                this.show_selection();
            }
        },

        nextField: function() {
            var index;
            if (this.selectedField) {
                index = this.editableFields.indexOf(this.selectedField);
                if (index < this.editableFields.length - 1) {
                    this.setSelectedField(this.editableFields[index + 1]);
                }
            }
        },

        priorField: function() {
            var index;
            if (this.selectedField) {
                index = this.editableFields.indexOf(this.selectedField);
                if (index > 0) {
                    this.setSelectedField(this.editableFields[index - 1]);
                }
            }
        },

        hide_editor: function() {
            var width,
                field,
                $div,
                $td;
            $td;
            if (this.editing) {
                try {
                    this.editMode = false;
                    $td = this.editor.$controlGroup.parent();
                    field = this.editor.field
                    $div = $td.find('div.' + field.field_name);

                    width = $td.outerWidth();
                    $td.css("padding-left", this.editor.paddingLeft)
                    $td.css("padding-top", this.editor.paddingTop)
                    $td.css("padding-right", this.editor.paddingRight)
                    $td.css("padding-bottom", this.editor.paddingBottom)

                    this.editor.$controlGroup.remove();
                    this.editor.removed = true;
                    this.editor = undefined;

                    $td.outerWidth(width);

                    $div.show();
                } finally {
                    this.editing = false;
                }
                this.focus();
            }
        },

        flush_editor: function() {
            if (this.editor && this.editing) {
                this.editor.change_field_text();
            }
        },

        selected_field_visible: function() {
            var field_name,
                $td;
            if (this.selectedField && this.freezed_table) {
                field_name = this.selectedField.field_name;
                $td = this.$table.find('tr:first td.' + field_name);
                if ($td.position().left < this.freezed_table.$element.width()) {
                    return false;
                }
            }
            return true;
        },

        show_editor: function() {
            var width,
                height,
                editor,
                $div,
                $td,
                $row = this.itemRow();
            if ($row && this.can_edit() && !this.editing && this.selectedField &&
                this.selected_field_visible() && this.item.record_count()) {
                if (!this.item.is_changing()) {
                    this.item.edit();
                }
                this.editMode = true;
                this.editor = new DBTableInput(this, this.selectedField);
                this.editor.$controlGroup.find('.controls, .input-prepend, .input-append, input').css('margin', 0);
                this.editor.$controlGroup.css('margin', 0);
                //~ this.editor.$controlGroup.find('.controls, .input-prepend, .input-append, input').css('margin-bottom', 0);
                //~ this.editor.$controlGroup.css('margin-bottom', 0);

                $div = $row.find('div.' + this.editor.field.field_name);
                $div.hide();
                $td = $row.find('td.' + this.editor.field.field_name);

                this.editor.$input.css('font-size', $td.css('font-size'));

                height = $td.innerHeight()// - parseInt($td.css('border-top-height'), 10) - parseInt($td.css('border-bottom-height'), 10);
                width = $td.outerWidth();
                this.editor.paddingLeft = $td.css("padding-left");
                this.editor.paddingTop = $td.css("padding-top");
                this.editor.paddingRight = $td.css("padding-right");
                this.editor.paddingBottom = $td.css("padding-bottom");

                this.editor.padding = $td.css("padding");
                $td.css("padding", 0);
                $td.outerWidth(width);

                $td.append(this.editor.$controlGroup);

                width = 0;
                this.editor.$input.parent().children('*').each(function() {
                    width += $(this).outerWidth(true);
                });
                this.editor.$input.width(this.editor.$input.width() + this.editor.$controlGroup.width() - width);
                if (this.editor.$input.outerHeight(true) > height) {
                    this.editor.$controlGroup.find('.controls, .input-prepend, .input-append, input, btn')
                        .outerHeight(height, true)
                }

                this.editor.update();

                if (this.is_focused()) {
                    this.editor.$input.focus();
                }
                this.editing = true;
            }
        },

        height: function(value) {
            if (value === undefined) {
                return this.$element.height();
            } else {
                this.$scroll_div.height(value - (this.$element.height() - this.$scroll_div.height()));
            }
        },

        fill_title: function($element) {
            var i,
                len,
                self = this,
                field,
                heading,
                div,
                cell,
                input,
                bl,
                checked = '',
                field_name,
                sel_count,
                desc,
                order_fields = {},
                shown_title,
                select_menu = '',
                cellWidth;
            if ($element === undefined) {
                $element = this.$element
            }
            if (!this._sorted_fields) {
                this._sorted_fields = [];
            }
            len = this._sorted_fields.length;
            for (i = 0; i < len; i++) {
                try {
                    desc = this._sorted_fields[i][1];
                    field = this.item.field_by_ID(this._sorted_fields[i][0])
                    if (desc) {
                        order_fields[field.field_name] = 'icon-arrow-down';
                    } else {
                        order_fields[field.field_name] = 'icon-arrow-up';
                    }
                } catch (e) {}
            }

            heading = $element.find("table.outer-table thead tr:first");
            heading.empty();
            if (this.options.multiselect) {
                if (this.item.master || !this.item._paginate) {
                    if (this.selections_get_all_selected()) {
                        checked = 'checked';
                    }
                    div = $('<div class="text-center multi-select" style="overflow: hidden"></div>');
                    sel_count = $('<p class="sel-count text-center">' + this.item.selections.length + '</p>')
                    div.append(sel_count);
                    input = $('<input class="multi-select-header" type="checkbox" ' + checked + ' tabindex="-1">');
                    div.append(input);
                    cell = $('<th class="multi-select-header"></th>').append(div);
                    cellWidth = this.getCellWidth('multi-select');
                    if (cellWidth && this.fields.length) {
                        cell.width(cellWidth);
                        div.width('auto');
                    }
                    heading.append(cell);
                }
                else {
                    if (this.selections_get_all_selected()) {
                        checked = 'checked';
                    }
                    div = $('<div class="text-center multi-select" style="overflow: hidden"></div>');
                    sel_count = $('<p class="sel-count text-center">' + this.item.selections.length + '</p>')
                    div.append(sel_count);
                    if (this.options.select_all) {
                        select_menu +=
                            '<li id="mselect-all"><a tabindex="-1" href="#">' + task.language.select_all + '</a></li>' +
                            '<li id="munselect-all"><a tabindex="-1" href="#">' + task.language.unselect_all + '</a></li>'
                    }
                    shown_title = task.language.show_selected
                    if (self.item.show_selected) {
                        shown_title = task.language.show_all
                    }
                    select_menu +=
                        '<li id="mshow-selected"><a tabindex="-1" href="#">' + shown_title + '</a></li>';
                    this.$element.find('#mselect-block').empty();
                    bl = $(
                        '<div style="height: 0; position: relative;">' +
                            '<div id="mselect-block" class="btn-group" style="position: absolute">' +
                                '<button type="button" class="btn mselect-btn" tabindex="-1">' +
                                    '<input class="multi-select-header" type="checkbox" tabindex="-1" style="margin: 0" ' + checked + '>' +
                                '</button>' +
                                '<a class="btn dropdown-toggle" data-toggle="dropdown" href="#" tabindex="-1" style="padding: 3px">' +
                                    '<span class="caret"></span>' +
                                '</a>' +
                                '<ul class="dropdown-menu">' +
                                    select_menu +
                                '</ul>' +
                            '</div>' +
                        '</div>'
                    );
                    input = bl.find('#mselect-block')
                    bl.find("#mselect-all").click(function(e) {
                        e.preventDefault();
                        self.selections_set_all_selected_ex(true);
                        self.$table.focus();
                    });
                    bl.find("#munselect-all").click(function(e) {
                        e.preventDefault();
                        self.selections_set_all_selected_ex(false);
                        self.$table.focus();
                    });
                    bl.find("#mshow-selected").click(function(e) {
                        e.preventDefault();
                        self.item.show_selected = !self.item.show_selected;
                        self.item.open(function() {
                            self.selections_update_selected();
                            self.$table.focus();
                        });
                    });
                    this.selection_block = bl;
                    this.$element.prepend(bl)
                    cell = $('<th class="multi-select"></th>').append(div);
                    cellWidth = this.getCellWidth('multi-select');
                    if (cellWidth && this.fields.length) {
                        cell.width(cellWidth);
                        div.width('auto');
                    }
                    heading.append(cell);
                    div.css('min-height', 50);
                    cell.css('padding-top', 0);
                    input.css('top', sel_count.outerHeight() + sel_count.position().top + 4);
                    input.css('left', (cell.outerWidth() - input.width()) / 2 + 1);
                }
            }
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                field = this.fields[i];
                div = $('<div class="text-center ' + field.field_name +
                    '" style="overflow: hidden"><p>' + field.field_caption + '</p></div>');
                cell = $('<th class="' + field.field_name + '" data-field_name="' + field.field_name + '"></th>').append(div);
                if (!this.options.title_word_wrap) {
                    div.css('height', this.text_height);
                    cell.css('height', this.text_height);
                }
                cellWidth = this.getCellWidth(field.field_name);
                if (cellWidth && (i < this.fields.length - 1)) {
                    cell.width(cellWidth);
                    div.width('auto');
                }
                if (order_fields[field.field_name]) {
                    cell.find('p').append('<i class="' + order_fields[field.field_name] + '"></i>');
                    cell.find('i').css('margin-right', 2)
                }
                heading.append(cell);
            }
            heading.append('<th class="fake-column" style="display: None;></th>');
            if (this.options.title_callback) {
                this.options.title_callback(heading, this.item)
            }
            this.selections_update_selected();
        },

        fill_footer: function($element) {
            var i,
                len,
                field,
                footer,
                old_footer,
                div,
                old_div,
                cell,
                cellWidth;
            if ($element === undefined) {
                $element = this.$element
            }
            footer = $element.find("table.outer-table tfoot tr:first");
            old_footer = footer.clone();
            footer.empty();
            if (this.options.multiselect) {
                div = $('<div class="text-center multi-select" style="overflow: hidden; width: 100%"></div>')
                cell = $('<th class="multi-select"></th>').append(div);
                footer.append(cell);
            }
            len = this.fields.length;
            for (i = 0; i < len; i++) {
                field = this.fields[i];
                div = $('<div class="text-center ' + field.field_name +
                    '" style="overflow: hidden; width: 100%">&nbsp</div>');
                old_div = old_footer.find('div.' + field.field_name)
                if (old_div.length) {
                    div.html(old_div.html());
                }
                cell = $('<th class="' + field.field_name + '"></th>').append(div);
                footer.append(cell);
            }
            if (!this.options.show_footer) {
                footer.hide();
            }
        },

        show_footer: function() {
            this.$element.find("table.outer-table tfoot tr:first").show();
        },

        hideFooter: function() {
            this.$element.find("table.outer-table tfoot tr:first").hide();
        },

        getCellWidth: function(field_name) {
            return this.cellWidths[field_name];
        },

        setCellWidth: function(field_name, value) {
            this.cellWidths[field_name] = value;
        },

        init_table: function(page_changed) {
            if (this.item._offset === 0 && !page_changed) {
                this.init_fields();
                this._sorted_fields = this.item._open_params.__order;
                if (this.item._paginate) {
                    this.page = 0;
                    this.update_page_info();
                    this.update_totals();
                } else {
                    this.field_width_updated = false;
                }
            }
            this.refresh();
        },

        form_closing: function() {
            var $modal = this.$element.closest('.modal');
            if ($modal) {
                return $modal.data('_closing')
            }
            return false;
        },

        do_after_open: function(page_changed) {
            var self = this;
            if (this.$table.is(':visible')) {
                this.init_table(page_changed);
                this.sync_freezed();
            }
            else {
                setTimeout(
                    function() {
                        self.init_table(page_changed);
                        self.sync_freezed();
                    },
                    1
                );
            }
        },

        update: function(state) {
            var recNo,
                self = this,
                row;
            if (this.form_closing()) {
                return;
            }
            switch (state) {
                case consts.UPDATE_OPEN:
                    this.do_after_open();
                    break;
                case consts.UPDATE_PAGE_CHANGED:
                    this.do_after_open(true);
                    break;
                case consts.UPDATE_CANCEL:
                    this.refreshRow();
                    break;
                case consts.UPDATE_APPEND:
                    row = this.addNewRow();
                    this.$table.append(row);
                    this.syncronize();
                    this.syncColWidth();
                    if (this.item.controls_enabled() && this.item.record_count() === 1) {
                        this.build();
                    }
                    break;
                case consts.UPDATE_INSERT:
                    row = this.addNewRow();
                    this.$table.prepend(row);
                    this.syncronize();
                    this.syncColWidth();
                    break;
                case consts.UPDATE_DELETE:
                    this.deleteRow();
                    break;
                case consts.UPDATE_SCROLLED:
                    this.syncronize();
                    break;
                case consts.UPDATE_CONTROLS:
                    this.build();
                    break;
                case consts.UPDATE_CLOSE:
                    this.$table.empty();
                    break;
                case consts.UPDATE_APPLIED:
                    this.update_totals();
                    break;
                case consts.UPDATE_SUMMARY:
                    this.update_summary();
                    break;
            }
        },

        update_summary: function() {
            var field_name;
            for (field_name in this.item._summary) {
                this.$foot.find('div.' + field_name).text(this.item._summary[field_name]);
            }

        },

        calc_summary: function(callback) {
            var self = this,
                i,
                copy,
                field_name,
                field,
                fields,
                count_field,
                sum_fields,
                count_fields,
                total_records = 0,
                expanded = false,
                search_field,
                funcs;
            //~ if (this.options.summary_fields && this.options.summary_fields.length && this.item._paginate) {
            if (this.item._paginate) {
                copy = this.item.copy({handlers: false, details: false});
                count_field = copy.fields[0].field_name,
                fields = [];
                count_fields = [];
                sum_fields = [];
                funcs = {};
                sum_fields.push(count_field);
                funcs[count_field] = 'count';
                for (i = 0; i < this.options.summary_fields.length; i++) {
                    field_name = this.options.summary_fields[i];
                    field = this.item.field_by_name(field_name);
                    if (field && this.fields.indexOf(field) !== -1) {
                        fields.push(field_name);
                        if (field.numeric_field()) {
                            sum_fields.push(field_name);
                            funcs[field_name] = 'sum';
                        }
                        else {
                            count_fields.push(field_name);
                        }
                    }
                }
                if (self.item._open_params.__search) {
                    search_field = this.item._open_params.__search[0];
                    sum_fields.push(search_field);
                    funcs[search_field] = 'count';
                    field = this.item.field_by_name(search_field);
                    if (field.lookup_item) {
                        expanded = true;
                    }
                }
                if (self.item._open_params.__filters) {
                    copy._where_list = self.item._open_params.__filters;
                }
                copy.open({expanded: expanded, fields: sum_fields, funcs: funcs,
                    params: {__summary: true}},
                    function() {
                        var i,
                            text;
                        copy.each_field(function(f, i) {
                            //~ if (f.field_name === self.item._primary_key) {
                            if (i == 0) {
                                total_records = f.value;
                            }
                            else {
                                self.$foot.find('div.' + f.field_name).text(f.display_text);
                            }
                        });
                        for (i = 0; i < count_fields.length; i++) {
                            self.$foot.find('div.' + count_fields[i]).text(total_records);
                        }
                        if (callback) {
                            callback.call(this, total_records);
                        }
                    }
                );
            }
        },

        update_field: function(field, refreshingRow) {
            var self = this,
                row = this.itemRow(),
                update,
                build,
                text,
                div;
            if (this.item.active && this.item.controls_enabled() && this.item.record_count()) {
                div = row.find('div.' + field.field_name);
                if (div.length) {
                    text = this.get_field_text(field);
                    if (text !== div.text()) {
                        div.text(text);
                        if (!refreshingRow) {
                            this.update_selected(row);
                        }
                    }
                }
            }
        },

        update_selected: function(row) {
            if (!row) {
                row = this.itemRow();
            }
            if (this.options.row_callback) {
                this.options.row_callback(row, this.item);
            }
        },

        deleteRow: function() {
            var $row = this.itemRow();
            $row.remove();
            this.syncColWidth();
        },

        itemRow: function() {
            if (this.item.record_count()) {
                try {
                    var info = this.item.rec_controls_info(),
                        row = $(info[this.id]);
                    this.update_selected(row);
                    return row;
                } catch (e) {
                    console.log(e);
                }
            }
        },

        refreshRow: function() {
            var self = this;
            this.each_field(function(field, i) {
                self.update_field(field, true);
            });
        },

        do_on_edit: function(mouseClicked) {
            if (this.item.lookup_field) {
                this.item.set_lookup_field_value();
            } else if (!this.can_edit() || (!this.editMode && mouseClicked)) {
                if (this.on_dblclick) {
                    this.on_dblclick.call(this.item, this.item);
                } else if (this.options.dblclick_edit) {
                    this.item.edit_record();
                }
                else {
                    this.show_editor();
                }
            } else if (this.can_edit() && !this.editMode && !mouseClicked) {
                this.show_editor();
            }
        },

        clicked: function(e, td) {
            var rec,
                field,
                $row = td.parent();
            if (this.can_edit()) {
                this.setSelectedField(this.item.field_by_name(td.data('field_name')));
            }
            rec = this.item._dataset.indexOf($row.data("record"));
            if (this.editMode && rec !== this.item.rec_no) {
                if (!this.item.is_edited()) {
                    this.item.edit();
                }
                this.flush_editor();
                this.item.post();
            }
            this.item._set_rec_no(rec);
            if (!this.editing && !this.is_focused()) {
                this.focus();
            }
            if (e.type === "dblclick") {
                this.do_on_edit(true);
            }
        },

        hide_selection: function() {
            if (this.selected_row) {
                if (this.selectedField) {
                    this.selected_row.removeClass("selected-focused selected");
                    this.selected_row.find('td.' + this.selectedField.field_name)
                        .removeClass("field-selected-focused field-selected")
                } else {
                    this.selected_row.removeClass("selected-focused selected");
                }
            }
        },


        show_selection: function() {
            var focused = this.is_focused(),
                selClassName = 'selected',
                selFieldClassName = 'field-selected';
            if (focused) {
                selClassName = 'selected-focused';
                selFieldClassName = 'field-selected-focused';
            }
            if (this.selected_row) {
                if (this.can_edit() && this.selectedField) {
                    this.selected_row.addClass(selClassName);
                    this.selected_row.find('td.' + this.selectedField.field_name)
                        .removeClass(selClassName)
                        .addClass(selFieldClassName);
                } else {
                    this.selected_row.addClass(selClassName);
                }
            }
        },

        select_row: function($row) {
            var divs,
                textHeight = this.text_height;
            this.update_selected_row($row);
            this.hide_selection();
            if (this.options.row_line_count && this.selected_row && this.options.expand_selected_row) {
                this.selected_row.find('tr, div').css('height', this.options.row_line_count * textHeight);
            }
            this.selected_row = $row;
            this.show_selection();
            if (this.options.row_line_count && this.options.expand_selected_row) {
                divs = this.selected_row.find('tr, div')
                divs.css('height', '');
                divs.css('height', this.options.expand_selected_row * textHeight);
            }
        },

        update_selected_row: function($row) {
            var containerTop,
                containerBottom,
                elemTop,
                elemBottom;
            if ($row.length) {
                containerTop = this.$scroll_div.scrollTop();
                containerBottom = containerTop + this.$scroll_div.height();
                elemTop = $row.get(0).offsetTop;
                elemBottom = elemTop + $row.height();
                if (elemTop < containerTop) {
                    this.$scroll_div.scrollTop(elemTop);
                } else if (elemBottom > containerBottom) {
                    this.$scroll_div.scrollTop(elemBottom - this.$scroll_div.height());
                }
            }
        },

        syncronize: function() {
            var self = this,
                rowChanged,
                $row;
            if (this.item.controls_enabled() && this.item.record_count() > 0) {
                $row = this.itemRow();
                rowChanged = !this.selected_row || (this.selected_row && $row && this.selected_row.get(0) !== $row.get(0));
                if (rowChanged && this.can_edit()) {
                    this.hide_editor();
                }
                try {
                    this.select_row(this.itemRow());
                } catch (e) {}

                if (rowChanged && this.can_edit() && this.editMode) {
                    clearTimeout(this.editorsTimeOut);
                    this.editorsTimeOut = setTimeout(function() {
                            self.show_editor();
                        },
                        75);
                }
            }
        },

        get_field_text: function(field) {
            if (field.get_lookup_data_type() === consts.BOOLEAN) {
                if (this.owner && (this.owner.on_field_get_text || this.owner.on_get_field_text)) {
                    return field.get_display_text();
                }
                else {
                    return field.get_lookup_value() ? '×' : ''
                }
            }
            else {
                return field.get_display_text();
            }
        },

        next_record: function() {
            this.item.next();
            if (this.item.eof()) {
                if (this.can_edit() && this.options.append_on_lastrow_keydown) {
                    this.item.append();
                } else {
                    this.nextPage();
                }
            }
        },

        prior_record: function() {
            var self = this;
            this.item.prior();
            if (this.item.bof()) {
                this.priorPage(function() {
                    self.item.last();
                });
            }
        },

        keydown: function(e) {
            var self = this,
                code = (e.keyCode ? e.keyCode : e.which);
            if (!e.ctrlKey && !e.shiftKey) {
                switch (code) {
                    case 33:
                    case 34:
                    case 35:
                    case 36:
                    case 38:
                    case 40:
                        if (this.editing && code !== 38 && code !== 40) {
                            return
                        }
                        e.preventDefault();
                        this.flush_editor();
                        this.hide_editor();
                        if (code === 33) {
                            this.priorPage();
                        } else if (code === 34) {
                            if (this.item._paginate && this.item.is_loaded) {
                                this.item.last();
                            } else {
                                this.nextPage();
                            }
                        } else if (code === 38) {
                            this.prior_record();
                        } else if (code === 40) {
                            this.next_record();
                        } else if (code === 36) {
                            this.firstPage();
                        } else if (code === 35) {
                            this.lastPage();
                        }
                        break;
                    case 37:
                        if (this.can_edit() && !this.editMode) {
                            this.priorField();
                        }
                        break;
                    case 39:
                        if (this.can_edit() && !this.editMode) {
                            this.nextField();
                        }
                        break;
                }
            }
        },

        keyup: function(e) {
            var self = this,
                multi_sel,
                code = (e.keyCode ? e.keyCode : e.which);
            if (e.target === this.$table.get(0) && !e.ctrlKey && !e.shiftKey) {
                switch (code) {
                    case 13:
                        e.preventDefault();
                        this.do_on_edit(false);
                        break;
                    case 33:
                    case 34:
                    case 35:
                    case 36:
                    case 38:
                    case 40:
                        e.preventDefault();
                        break;
                    case 32:
                        e.preventDefault();
                        if (this.options.multiselect) {
                            multi_sel = this.itemRow().find('input.multi-select');
                            this.selections_set_selected(!multi_sel[0].checked);
                            multi_sel.prop('checked', this.selections_get_selected());
                        }
                        break
                }
            }
        },

        keypress: function(e) {
            var self = this,
                multi_sel,
                code = e.which;
            if (code > 32 && this.can_edit() && this.options.keypress_edit && !this.editMode) {
                if (this.selectedField && this.selectedField.valid_char_code(code)) {
                    this.show_editor();
                }
            }
        },

        set_page_number: function(value, callback, chech_last_page) {
            var self = this;

            if (chech_last_page === undefined) {
                chech_last_page = true;
            }
            if (!this.item._paginate || this.loading) {
                return;
            }
            if (value < this.page_count || value === 0) {
                this._remove_tooltip();
                this.page = value;
                this.scrollLeft = this.$element.find('.table-container').get(0).scrollLeft;
                if (this.master_table) {
                    this.master_table.scrollLeft = this.master_table.$element.find('.table-container').get(0).scrollLeft;
                }
                this.loading = true;
                if (this.item.record_count()) {
                    this.item._do_before_scroll();
                }
                this.item.open({offset: this.page * this.item._limit}, function() {
                    if (callback) {
                        callback.call(self);
                    }
                    self.loading = false;
                    self.update_page_info();
                    self.$element.find('.table-container').get(0).scrollLeft = self.scrollLeft;
                    if (self.master_table) {
                        self.master_table.$element.find('.table-container').get(0).scrollLeft = self.master_table.scrollLeft;
                    }
                    if (value === this.page_count - 1 && self.item.rec_count === 0 && chech_last_page) {
                        self.update_totals(function() {
                            self.set_page_number(self.page_count - 1, callback, false)
                        })
                    }
                    else if (callback) {
                        callback.call(this);
                    }
                });
            }
        },

        reload: function(callback) {
            if (this.item._paginate) {
                this.set_page_number(this.page, callback);
            } else {
                this.open(callback);
            }
        },

        update_page_info: function() {
            if (this.options.show_paginator && this.$pageInput) {
                this.$pageInput.val(this.page + 1);
                if (this.page === 0) {
                    this.$fistPageBtn.addClass("disabled");
                    this.$priorPageBtn.addClass("disabled");
                } else {
                    this.$fistPageBtn.removeClass("disabled");
                    this.$priorPageBtn.removeClass("disabled");
                }
                if (this.item.is_loaded) {
                    this.$lastPageBtn.addClass("disabled");
                    this.$nextPageBtn.addClass("disabled");
                } else {
                    this.$lastPageBtn.removeClass("disabled");
                    this.$nextPageBtn.removeClass("disabled");
                }
            }
            if (this.options.on_page_changed) {
                this.options.on_page_changed.call(this.item, this.item, this);
            }
        },

        update_totals: function(callback) {
            var self = this;
            this.calc_summary(function(count) {
                self.update_page_count(count);
                if (callback) {
                    callback();
                }
            })
        },

        update_page_count: function(count) {
            if (this.item._paginate && self.record_count !== count) {
                this.record_count = count;
                this.page_count = Math.ceil(count / this.row_count);
                if (this.$page_count) {
                    this.$page_count.text(language.of + ' 1');
                    if (this.page_count) {
                        this.$page_count.text(language.of + ' ' + this.page_count);
                    }
                    else {
                        this.$page_count.text(language.of + ' ' + 1);
                    }
                }
                if (this.options.on_pagecount_update) {
                    this.options.on_pagecount_update.call(this.item, this.item, this);
                }
                if (this.options.on_page_changed) {
                    this.options.on_page_changed.call(this.item, this.item, this);
                }
            }
        },

        firstPage: function(callback) {
            if (this.item._paginate) {
                this.set_page_number(0, callback);
            } else {
                this.item.first();
            }
        },

        nextPage: function(callback) {
            var lines,
                clone;
            if (this.item._paginate) {
                if (!this.item.is_loaded) {
                    this.set_page_number(this.page + 1, callback);
                }
            } else {
                clone = this.item.clone();
                clone._set_rec_no(this.item._get_rec_no())
                lines = this.$scroll_div.innerHeight() / this.row_height - 1;
                for (var i = 0; i < lines; i++) {
                    if (!clone.eof()) {
                        clone.next();
                    } else {
                        break;
                    }
                }
                this.item._set_rec_no(clone._get_rec_no());
            }
        },

        priorPage: function(callback) {
            var lines,
                clone;
            if (this.item._paginate) {
                if (this.page > 0) {
                    this.set_page_number(this.page - 1, callback);
                } else {
                    this.syncronize();
                }
            } else {
                clone = this.item.clone();
                clone._set_rec_no(this.item._get_rec_no());
                lines = this.$scroll_div.innerHeight() / this.row_height - 1;
                for (var i = 0; i < lines; i++) {
                    if (!clone.eof()) {
                        clone.prior();
                    } else {
                        break;
                    }
                }
                this.item._set_rec_no(clone._get_rec_no());
            }
        },

        lastPage: function(callback) {
            var self = this;
            if (this.item._paginate) {
                this.set_page_number(this.page_count - 1, callback);
            } else {
                this.item.last();
            }
        },

        each_field: function(callback) {
            var i = 0,
                len = this.fields.length,
                value;
            for (; i < len; i++) {
                value = callback.call(this.fields[i], this.fields[i], i);
                if (value === false) {
                    break;
                }
            }
        },

        addNewRow: function() {
            var $row = $(this.newRow()),
                rec = this.item._get_rec_no(),
                info;
            $row.data("record", this.item._dataset[rec]);
            info = this.item.rec_controls_info();
            info[this.id] = $row.get(0);
            if (this.options.row_callback) {
                this.options.row_callback($row, this.item);
            }
            return $row;
        },

        newColumn: function(columnName, align, text, index, setFieldWidth) {
            var cellWidth = this.getCellWidth(columnName),
                classStr = 'class="' + columnName + '"',
                dataStr = 'data-field_name="' + columnName + '"',
                tdStyleStr = 'style="text-align:' + align + ';overflow: hidden',
                divStyleStr = 'style="overflow: hidden';
            if (this.text_height && this.options.row_line_count) {
                divStyleStr += '; height: ' + this.options.row_line_count * this.text_height + 'px; width: auto';
            }
            if (setFieldWidth && cellWidth && (index < this.fields.length - 1)) {
                tdStyleStr += '; width: ' + cellWidth + 'px';
            }
            tdStyleStr +=  '""';
            divStyleStr += '"';
            return '<td ' + classStr + ' ' + dataStr + ' ' + tdStyleStr + '>' +
                '<div ' + classStr + ' ' + divStyleStr + '>' + text +
                '</div>' +
                '</td>';
        },

        newRow: function() {
            var f,
                i,
                len,
                field,
                align,
                text,
                rowStr,
                checked = '',
                setFieldWidth = !this.auto_field_width ||
                (this.auto_field_width && this.field_width_updated);
            len = this.fields.length;
            rowStr = '';
            if (this.options.multiselect) {
                if (this.selections_get_selected()) {
                    checked = 'checked';
                }
                rowStr += this.newColumn('multi-select', 'center', '<input class="multi-select" type="checkbox" ' + checked + ' tabindex="-1">', -1, setFieldWidth);
            }
            for (i = 0; i < len; i++) {
                field = this.fields[i];
                f = this.item[field.field_name];
                if (!(f instanceof Field)) {
                    f = this.item.field_by_name(field.field_name);
                }
                text = this.get_field_text(f);
                align = f.data_type === consts.BOOLEAN ? 'center' : align_value[f.alignment]
                rowStr += this.newColumn(f.field_name, align, text, i, setFieldWidth);
            }
            rowStr += '<td class="fake-column" style="display: None;"></td>'
            return '<tr class="inner">' + rowStr + '</tr>';
        },

        getElementWidth: function(element) {
            if (!element.length) {
                return 0;
            }
            if (element.is(':visible')) {
                return element.width()
            } else {
                return this.getElementWidth(element.parent())
            }
        },

        syncColWidth: function(all_cols) {
            var $row,
                field,
                $th,
                $td,
                i,
                count,
                width,
                len = this.fields.length;
            if (this.item.record_count()) {
                $row = this.$table.find("tr:first-child");
                if (this.options.multiselect) {
                    $th = this.$head.find('th.' + 'multi-select');
                    $td = $row.find('td.' + 'multi-select');
                    width = $th.width();
                    $th.width(width);
                    $td.width(width);
                }
                count = len - 1;
                if (all_cols) {
                    count = len;
                }
                for (i = 0; i < count; i++) {
                    field = this.fields[i];
                    $th = this.$head.find('th.' + field.field_name);
                    $td = $row.find('td.' + field.field_name);

                    width = $th.width();
                    $th.width(width);
                    $td.width(width);
                }
                if (all_cols) {
                    return;
                }
                if (this.fields.length) {
                    field = this.fields[len - 1];
                    $th = this.$head.find('th.' + field.field_name);
                    if ($th.width() < 0) {
                        this.$head.find('th.' + 'fake-column').show();
                        this.$table.find('td.' + 'fake-column').show();
                        this.set_saved_width($row, true);
                        this.syncColWidth(true);
                    }
                    else {
                        this.$head.find('th.' + 'fake-column').hide();
                        this.$table.find('td.' + 'fake-column').hide();
                        //~ this.set_saved_width($row, true);
                        //~ this.syncColWidth(true);
                    }
                }
            }
        },

        set_saved_width: function(row, all_cols) {
            var i,
                len = this.fields.length,
                count = len - 1,
                field,
                width;
            if (this.options.multiselect) {
                width = this.getCellWidth('multi-select');
                row.find("td." + 'multi-select').width(width);
                this.$head.find("th." + 'multi-select').width(width);
            }
            if (all_cols) {
                count = len;
            }
            for (i = 0; i < count; i++) {
                field = this.fields[i];
                width = this.getCellWidth(field.field_name);
                row.find("td." + field.field_name).width(width);
                this.$head.find("th." + field.field_name).width(width);
            }
        },

        fill_rows: function() {
            var i,
                len,
                row,
                rows,
                rec,
                item_rec_no,
                rec_nos = [],
                info,
                clone = this.item.clone(true);
            clone.on_field_get_text = this.item.on_field_get_text;
            rows = ''
            item_rec_no = this.item.rec_no;
            try {
                while (!clone.eof()) {
                    this.item._cur_row = clone._cur_row;
                    rows += this.newRow();
                    rec_nos.push(clone._get_rec_no());
                    clone.next();
                }
                this.$table.html(rows);
                rows = this.$table.find("tr");
                len = rows.length;
                for (i = 0; i < len; i++) {
                    row = rows.eq(i);
                    rec = rec_nos[i]
                    clone._set_rec_no(rec);
                    this.item._cur_row = rec;
                    row.data("record", clone._dataset[rec]);
                    info = clone.rec_controls_info();
                    info[this.id] = row.get(0);
                    if (this.options.row_callback) {
                        this.options.row_callback(row, this.item);
                    }
                }
            } finally {
                this.item._cur_row = item_rec_no;
            }
        },

        refresh: function(fill_rows) {
            var i,
                len,
                field,
                row, tmpRow,
                cell,
                cellWidth,
                headCell,
                footCell,
                table,
                rows,
                title = '',
                rec,
                item_rec_no,
                rec_nos = [],
                info,
                is_focused,
                is_visible = this.$table.is(':visible'),
                editable_val,
                clone = this.item.clone(true),
                container = $('<div>');

            if (fill_rows === undefined) {
                fill_rows = true
            }
            is_focused = this.is_focused();
            if (this.options.editable && this.editMode && this.editor) {
                if (!is_focused) {
                    is_focused = this.editor.$input.is(':focus');
                }
                editable_val = this.editor.$input.value;
                this.hide_editor();
            }

            container.css("position", "absolute")
                //~ .css("top", 0)
                .css("top", -1000)
                .width(this.getElementWidth(this.$element));
            $('body').append(container);
            this.$element.detach();
            container.append(this.$element);

            if (fill_rows) {
                this.$table.empty();
                this.$head.empty();
                if (this.selection_block) {
                    this.selection_block.remove();
                }
                this.$foot.hide();
                this.$outer_table.find('#top-td').attr('colspan', this.colspan);

                this.fill_rows();
            }

            row = this.$table.find("tr:first");
            if (this.auto_field_width && !this.field_width_updated) {
                this.$table.css('table-layout', 'auto');
                this.$outer_table.css('table-layout', 'auto');
                tmpRow = '<tr>'
                if (this.options.multiselect) {
                    tmpRow = tmpRow + '<th class="multi-select">' +
                        '<div class="text-center multi-select" style="overflow: hidden"></div>' +
                        '</th>';
                }
                len = this.fields.length;
                for (i = 0; i < len; i++) {
                    tmpRow = tmpRow + '<th class="' + this.fields[i].field_name + '" ><div style="overflow: hidden">' +
                        this.fields[i].field_caption + '</div></th>';
                }
                tmpRow = $(tmpRow + '</tr>');
                this.$table.prepend(tmpRow);
                for (var field_name in this.options.column_width) {
                    if (this.options.column_width.hasOwnProperty(field_name)) {
                        tmpRow.find("." + field_name).css("width", this.options.column_width[field_name]);
                    }
                }
                if (this.options.multiselect) {
                    cell = row.find("td." + 'multi-select');
                    this.setCellWidth('multi-select', 38);
                }
                for (i = 0; i < len; i++) {
                    field = this.fields[i];
                    cell = row.find("td." + field.field_name);
                    this.setCellWidth(field.field_name, cell.width());
                }
                this.$table.css('table-layout', 'fixed');
                this.$outer_table.css('table-layout', 'fixed');
                this.fill_title(container);
                this.fill_footer(container);
                this.set_saved_width(row);
                if (this.item.record_count() > 0 && is_visible) {
                    this.field_width_updated = true;
                }
                tmpRow.remove();
                if (this.field_width_updated) {
                    this.refresh(false);
                }
            } else {
                this.fill_title(container);
                this.fill_footer(container);
                this.syncColWidth();
            }

            if (this.options.show_footer) {
                this.$foot.show();
            }
            this.$element.detach();
            this.$container.append(this.$element);

            container.remove();

            this.$container.find('tfoot .pager').attr('colspan', this.colspan);

            this.syncronize();
            if (is_focused) {
                this.focus();
            }
            if (this.can_edit() && this.editMode && this.editor) {
                this.show_editor();
                this.editor.$input.value = editable_val;
            }
            this.update_summary();
        },

        build: function() {
            var scroll_top = this.$scroll_div.scrollTop();
            this.init_fields();
            this.field_width_updated = false;
            this.refresh();
            this.syncColWidth();
            this.$scroll_div.scrollTop(scroll_top);
            this.syncronize();
        },

        is_focused: function() {
            return this.$table.get(0) === document.activeElement;
        },

        focus: function() {
            if (!this.is_focused()) {
                this.$table.focus();
            }
        }
    };

    /**********************************************************************/
    /*                      DBAbstractInput class                         */
    /**********************************************************************/

    function DBAbstractInput(field) {
        var self = this;
        this.field = field;
        this.read_only = false;
        this.is_changing = true;
    }

    DBAbstractInput.prototype = {
        constructor: DBAbstractInput,

        create_input: function(field, tabIndex, container) {
            var self = this,
                align,
                height,
                width,
                $controlGroup,
                $label,
                $input,
                $div,
                $ul,
                $li,
                $a,
                $btn,
                $controls,
                $btnCtrls,
                $help,
                field_type,
                field_mask,
                inpit_btn_class = '';
            if ($('body').css('font-size') === '12px') {
                inpit_btn_class = ' btn12'
            }
            else {
                inpit_btn_class = ' btn14'
            }
            if (!field) {
                return;
            }
            if (this.label) {
                $label = $('<label class="control-label"></label>')
                    .attr("for", field.field_name).text(this.label).
                addClass(field.field_name);
                if (this.field.required) {
                    $label.addClass('required');
                }
                if (this.label_width) {
                    $label.width(this.label_width);
                }
            }
            if (field.get_lookup_data_type() === consts.BOOLEAN) {
                $input = $('<input>')
                    .attr("type", "checkbox")
                    .click(function(e) {
                        self.field.value = !self.field.value;
                    });
            } else if (field.get_lookup_data_type() === consts.LONGTEXT) {
                $input = $('<textarea>').innerHeight(70);
            } else {
                $input = $('<input>').attr("type", "text")
            }
            if (tabIndex) {
                $input.attr("tabindex", tabIndex + "");
            }
            $controls = $('<div class="controls"></div>');
            if (this.label_width && !this.label_on_top) {
                $controls.css('margin-left', this.label_width + 20 + 'px');
            }
            field_mask = this.field.field_mask;
            if (!field_mask) {
                field_mask = this.field.get_mask()
            }
            if (field_mask) {
                try {
                    $input.mask(field_mask);
                } catch (e) {}
            }
            this.$input = $input;
            this.$input.addClass(field.field_name)
            if (task.old_forms) {
                this.$input.attr("id", field.field_name);
            }
            this.$input.addClass('dbinput');
            this.$input.data('dbinput', this);
            this.$input.focus(function(e) {
                self.focusIn(e);
            });
            this.$input.blur(function(e) {
                self.focusOut();
            });
            this.$input.on('input', (function(e) {
                self.changed = true;
            }));
            this.$input.on('change', (function(e) {
                self.changed = true;
            }));
            this.$input.mousedown(function(e) {
                self.mouseIsDown = true;
            });
            this.$input.mouseup(function(e) {
                if (!self.mouseIsDown) {
                    self.$input.select();
                }
                self.mouseIsDown = false;
            });

            this.$input.keydown($.proxy(this.keydown, this));
            this.$input.keyup($.proxy(this.keyup, this));
            this.$input.keypress($.proxy(this.keypress, this));
            if (field.lookup_item && !field.master_field || field.lookup_values) {
                $btnCtrls = $('<div class="input-prepend input-append"></div>');
                $btn = $('<button class="btn' + inpit_btn_class + '"type="button"><i class="icon-remove-sign"></button>');
                $btn.attr("tabindex", -1);
                $btn.click(function() {
                    field.set_value(null);
                });
                this.$firstBtn = $btn;
                $btnCtrls.append($btn);
                $btnCtrls.append($input);
                $btn = $('<button class="btn' + inpit_btn_class + '" type="button"><i></button>');
                $btn.attr("tabindex", -1);
                $btn.click(function() {
                    if (field.lookup_values) {
                        self.dropdown.enter_pressed();
                    }
                    else {
                        self.selectValue();
                    }
                });
                this.$lastBtn = $btn;
                $btnCtrls.append($btn);
                $controls.append($btnCtrls);
                if (field.lookup_values) {
                    $btnCtrls.addClass("lookupvalues-input-container");
                    $input.addClass("input-lookupvalues");
                    this.$lastBtn.find('i').addClass("icon-chevron-down");
                    this.dropdown = new DropdownList(this.field, $input);
                    if (field.filter && field.data_type === consts.BOOLEAN) {
                        $input.width(36);
                    }
                }
                else {
                    $btnCtrls.addClass("lookupfield-input-container");
                    $input.addClass("input-lookupitem");
                    this.$lastBtn.find('i').addClass("icon-folder-open");
                    if (this.field.enable_typeahead) {
                        this.dropdown = new DropdownTypeahead(this.field,
                            $input, this.field.typeahead_options());
                    }
                }
            } else {
                field_type = field.get_lookup_data_type();
                switch (field_type) {
                    case consts.TEXT:
                        $input.addClass("input-text");
                        $controls.append($input);
                        break;
                    case consts.INTEGER:
                        $input.addClass("input-integer");
                        $controls.append($input);
                        break;
                    case consts.FLOAT:
                        $input.addClass("input-float");
                        $controls.append($input);
                        break;
                    case consts.CURRENCY:
                        $input.addClass("input-currency");
                        $controls.append($input);
                        break;
                    case consts.DATE:
                    case consts.DATETIME:
                        $btnCtrls = $('<div class="input-prepend input-append"></div>');
                        $btn = $('<button class="btn' + inpit_btn_class + '" type="button"><i class="icon-remove-sign"></button>');
                        $btn.attr("tabindex", -1);
                        $btn.click(function() {
                            field.set_value(null);
                        });
                        this.$firstBtn = $btn;
                        $btnCtrls.append($btn);
                        if (field_type === consts.DATETIME) {
                            $btnCtrls.addClass("datetime-input-container");
                            $input.addClass("input-datetime");
                        }
                        else {
                            $btnCtrls.addClass("date-input-container");
                            $input.addClass("input-date");
                        }
                        $btnCtrls.append($input);
                        $btn = $('<button class="btn' + inpit_btn_class + '" type="button"><i class="icon-calendar"></button>');
                        $btn.attr("tabindex", -1);
                        $btn.click(function() {
                            self.showDatePicker();
                        });
                        this.$lastBtn = $btn;
                        $btnCtrls.append($btn);
                        $controls.append($btnCtrls);
                        break;
                    case consts.BOOLEAN:
                        $controls.append($input);
                        break;
                    case consts.LONGTEXT:
                        $input.addClass("input-longtext");
                        $controls.append($input);
                        break;
                }
                align = field.data_type === consts.BOOLEAN ? 'center' : align_value[field.alignment];
                this.$input.css("text-align", align);
            }
            if (this.label_on_top) {
                this.$controlGroup = $('<div class="input-container"></div>');
            } else {
                this.$controlGroup = $('<div class="control-group input-container"></div>');
            }
            if (this.label) {
                this.$controlGroup.append($label);
                if (!this.label_width) {
                    this.$controlGroup.addClass('label-size' + this.label_size);
                }
            }
            this.$controlGroup.append($controls);

            if (container) {
                container.append(this.$controlGroup);
            }

            $controls.find('.add-on').css('padding-top',
                parseInt($controls.find('.add-on').css('padding-top')) +
                parseInt($controls.find('.add-on').css('border-top-width')) - 1 +
                'px')
            $controls.find('.add-on').css('padding-bottom',
                parseInt($controls.find('.add-on').css('padding-bottom')) +
                parseInt($controls.find('.add-on').css('border-bottom-width')) - 1 +
                'px')

            this.$modalForm = this.$input.closest('.modal');
            this.field.controls.push(this);

            this.$input.on('mouseenter', function() {
                var $this = $(this);
                if (self.error) {
                    $this.tooltip('show');
                }
            });

            if (!this.grid && this.field.field_placeholder) {
                this.$input.attr('placeholder', this.field.field_placeholder);
            }

            if (!this.grid && this.field.field_help) {
                $help = $('<a href="#" tabindex="-1"><span class="badge help-badge">?</span></a>');
                $help.click(function(e) {
                    e.preventDefault();
                    self.$lastBtn.focus().click();
                });
                this.$help = $help;
                $help.find('span')
                    .popover({
                        container: 'body',
                        placement: 'right',
                        trigger: 'hover',
                        html: true,
                        title: self.field.field_caption,
                        content: self.field.field_help
                    })
                    .click(function(e) {
                        e.preventDefault();
                    });
                if ($btnCtrls) {
                    $controls.append($help);
                    $help.find('span').addClass('btns-help-badge')
                }
                else {
                    $controls.append($help);
                }
            }
            this.$input.tooltip({
                    container: 'body',
                    placement: 'bottom',
                    title: ''
                })
                .on('hide hidden show shown', function(e) {
                    if (e.target === self.$input.get(0)) {
                        e.stopPropagation()
                    }
                });

            this.$input.bind('destroyed', function() {
                self.field.controls.splice(self.field.controls.indexOf(self), 1);
                if (self.dropdown){
                    self.dropdown.destroy();
                }
                if (self.$help) {
                    self.$help.find('span').popover('destroy');
                }
            });

            this.update();
        },

        form_closing: function() {
            if (this.$modalForm) {
                return this.$modalForm.data('_closing')
            }
            return false;
        },

        set_read_only: function(value) {
            if (this.$firstBtn) {
                this.$firstBtn.prop('disabled', value);
            }
            if (this.$lastBtn) {
                this.$lastBtn.prop('disabled', value);
            }
            if (this.$input) {
                this.$input.prop('disabled', value);
            }
        },

        update: function(state) {
            var placeholder = this.field.field_placeholder,
                focused = this.$input.get(0) === document.activeElement,
                is_changing = this.is_changing;

            if (this.field.field_kind === consts.ITEM_FIELD) {
                is_changing = this.field.owner.is_changing();
                if (!this.field.owner.active || this.field.owner.record_count() === 0) {
                    this.read_only = true;
                    this.is_changing = false;
                    this.set_read_only(true);
                    this.$input.val('');
                    return
                }
            }
            if (!this.removed && !this.form_closing()) {
                if (this.read_only !== this.field._get_read_only() || is_changing !== this.is_changing) {
                    this.read_only = this.field._get_read_only();
                    this.is_changing = is_changing;
                    this.set_read_only(this.read_only || !this.is_changing);
                }
                if (this.field.master_field) {
                    this.set_read_only(true);
                }
                if (this.field.get_lookup_data_type() === consts.BOOLEAN) {
                    if (this.field.get_lookup_value()) {
                        this.$input.prop("checked", true);
                    } else {
                        this.$input.prop("checked", false);
                    }
                }
                if (this.field.lookup_values) {
                    this.$input.val(this.field.display_text);
                } else {
                    if (focused && this.$input.val() !== this.field.get_text() ||
                        !focused && this.$input.val() !== this.field.get_display_text()) {
                        this.errorValue = undefined;
                        this.error = undefined;
                        if (focused && !this.field.lookup_item && !this.field.lookup_values) {
                            this.$input.val(this.field.get_text());
                        } else {
                            this.$input.val(this.field.get_display_text());
                        }
                    }
                }
                if (this.read_only || !this.is_changing || this.field.master_field) {
                    placeholder = '';
                }
                this.$input.attr('placeholder', placeholder);
                this.updateState(true);
                this.changed = false;
            }
            if (state === consts.UPDATE_CLOSE) {
                this.$input.val('');
                this.set_read_only(true);
            }
        },

        keydown: function(e) {
            var code = (e.keyCode ? e.keyCode : e.which);
            if (this.field.lookup_item && !this.field.enable_typeahead && !(code === 229 || code === 9 || code == 8)) {
                e.preventDefault();
            }
            if (code === 9) {
                if (this.grid && this.grid.editMode) {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.grid.priorField();
                    } else {
                        this.grid.nextField();
                    }
                }
            }
        },

        keyup: function(e) {
            var typeahead,
                code = (e.keyCode ? e.keyCode : e.which);
            if (this.field.enable_typeahead) {
                typeahead = this.$input.data('jamtypeahead')
                if (typeahead && typeahead.shown) {
                    return;
                }
            }
            if (code === 13 && !e.ctrlKey && !e.shiftKey) {
                if (this.grid && this.grid.editMode) {
                    if (!(this.dropdown && this.dropdown.shown)) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (!this.grid.item.is_changing()) {
                            this.grid.item.edit();
                        }
                        this.grid.flush_editor();
                        this.grid.hide_editor();
                        if (this.grid.item.is_changing()) {
                            this.grid.item.post();
                        }
                    }
                } else if (this.field.lookup_item && !this.field.enable_typeahead) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.selectValue();
                } else if ((this.field.data_type === consts.DATE) || (this.field.data_type === consts.DATETIME)) {
                    e.stopPropagation();
                    e.preventDefault();
                    this.showDatePicker();
                }
            } else if (code === 27) {
                if (this.grid && this.grid.editMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.grid.item.cancel();
                    this.grid.hide_editor();
                } else if (this.field.lookup_values) {
                    if (this.$input.parent().hasClass('open')) {
                        this.$input.parent().removeClass('open');
                        e.stopPropagation();
                    }
                }
                else if (this.changed) {
                    this.update();
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        },

        keypress: function(e) {
            var code = e.which;
            if (this.field.lookup_item && !this.field.enable_typeahead) {
                e.preventDefault();
            }
            if (this.$input.is('select')) {} else if (code && !this.field.valid_char_code(code)) {
                e.preventDefault();
            }
        },

        showDatePicker: function() {
            var self = this,
                format;
            if (this.field.data_type === consts.DATE) {
                format = locale.D_FMT;
            } else if (this.field.data_type === consts.DATETIME) {
                format = locale.D_T_FMT;
            }

            this.$input.datepicker(
                {
                    weekStart: parseInt(language.week_start, 10),
                    format: format,
                    daysMin: language.days_min.slice(1, -1).split(','),
                    months: language.months.slice(1, -1).split(','),
                    monthsShort: language.months_short.slice(1, -1).split(','),
                    date: this.field.value
                })
                .on('show', function(e) {
                    if (e.target === self.$input.get(0)) {
                        e.stopPropagation();
                        self.$input.datepicker().attr('data-weekStart', 1);
                    }
                })
                .on('hide hidden shown', function(e) {
                    if (e.target === self.$input.get(0)) {
                        e.stopPropagation()
                    }
                })
                .on('changeDate', function(e) {
                    self.field.set_value(e.date);
                    self.$input.datepicker('hide');
                });
            this.$input.datepicker('show');
        },

        selectValue: function() {
            if (this.field.on_entry_button_click) {
                this.field.on_entry_button_click.call(this.item, this.field);
            } else {
                this.field.select_value();
            }
        },

        change_field_text: function() {
            var result = true,
                data_type = this.field.data_type,
                text;
            this.errorValue = undefined;
            this.error = undefined;
            if (this.field.lookup_item || this.field.lookup_values) {
                if (this.$input.val() !== this.field.get_lookup_text()) {
                    this.$input.val(this.field.get_display_text());
                }
            } else {
                try {
                    text = this.$input.val();
                    if (text !== this.field.text) {
                        if (this.field.field_kind === consts.ITEM_FIELD && !this.field.owner.is_changing()) {
                            this.field.owner.edit();
                        }
                        if (text === '') {
                            this.field.set_value(null);
                        } else {
                            this.field.set_text(text);
                            if (!(this.field.field_kind === consts.ITEM_FIELD && !this.field.owner.rec_count)) {
                                this.field.check_valid();
                                if (this.$input.is(':visible')) {
                                    this.$input.val(text);
                                }
                            }
                        }
                        this.changed = false;
                    }
                } catch (e) {
                    this.errorValue = text;
                    this.error = e;
                    this.updateState(false);
                    if (e.stack) {
                        console.error(e.stack);
                    }
                    result = false;
                }
            }
            return result;
        },

        focusIn: function(e) {
            this.hideError();
            if (this.field.lookup_item && !this.field.enable_typeahead) {
                this.$input.val(this.field.get_display_text());
            } else {
                if (this.errorValue) {
                    this.$input.val(this.errorValue);
                } else if (this.field.lookup_item || this.field.lookup_values) {
                    this.$input.val(this.field.get_display_text());
                } else {
                    this.$input.val(this.field.get_text());
                }
                if (!this.mouseIsDown) {
                    this.$input.select();
                    this.mouseIsDown = false;
                }
            }
            this.mouseIsDown = false;
        },

        focusOut: function(e) {
            var result = false;

            if (!this.changed) {
                if (this.field.field_kind !== consts.ITEM_FIELD || this.field.owner.rec_count) {
                    this.$input.val(this.field.get_display_text());
                }
                return;
            }
            if (this.grid && this.grid.editMode) {
                if (this.grid.item.is_changing()) {
                    this.grid.flush_editor();
                    this.grid.item.post();
                    this.grid.hide_editor();
                }
                result = true;
            }
            if (this.field.data_type === consts.BOOLEAN) {
                result = true;
            } else if (!this.grid && this.change_field_text()) {
                if (this.$input.is(':visible')) {
                    this.$input.val(this.field.get_display_text());
                }
                result = true;
            }
            this.updateState(result);
            return result;
        },

        updateState: function(value) {
            if (value) {
                if (this.$controlGroup) {
                    this.$controlGroup.removeClass('error');
                }
                this.errorValue = undefined;
                this.error = undefined;
                this.$input.tooltip('hide')
                    .attr('data-original-title', '')
                    .tooltip('fixTitle');
                this.hideError();
            } else {
                task.alert_error(this.error, {replace: false});
                //~ task.alert(this.error, {replace: false});
                this.showError();
                if (this.$controlGroup) {
                    this.$controlGroup.addClass('error');
                }
                this.$input.tooltip('hide')
                    .attr('data-original-title', this.error)
                    .tooltip('fixTitle');
            }
        },

        showError: function(value) {},

        hideError: function(value) {},

        focus: function() {
            this.$input.focus();
        }

    };

    /**********************************************************************/
    /*                        DBTableInput class                          */
    /**********************************************************************/

    DBTableInput.prototype = new DBAbstractInput();
    DBTableInput.prototype.constructor = DBTableInput;

    function DBTableInput(grid, field) {
        DBAbstractInput.call(this, field);
        this.grid = grid;
        this.create_input(field, 0);
        this.$input.attr("autocomplete", "off");
        this.$input.addClass('dbtableinput');
    }

    $.extend(DBTableInput.prototype, {

    });

    /**********************************************************************/
    /*                           DBInput class                            */
    /**********************************************************************/

    DBInput.prototype = new DBAbstractInput();
    DBInput.prototype.constructor = DBInput;

    function DBInput(field, index, container, options, label) {
        DBAbstractInput.call(this, field);
        if (this.field.owner && this.field.owner.edit_form &&
            this.field.owner.edit_form.hasClass("modal")) {
            this.$edit_form = this.field.owner.edit_form;
        }
        this.label = label;
        this.label_width = options.label_width;
        this.label_on_top = options.label_on_top;
        this.label_size = options.label_size;
        if (!this.label_size) {
            this.label_size = 3;
        }
        if (!this.label) {
            this.label = this.field.field_caption;
        }
        this.create_input(field, index, container);
    }

    $.extend(DBInput.prototype, {

        showError: function(value) {
            if (this.$edit_form && this.$edit_form.hasClass("normal-modal-border")) {
                this.$edit_form.removeClass("nomal-modal-border");
                this.$edit_form.addClass("error-modal-border");
            }
        },

        hideError: function(value) {
            if (this.$edit_form && this.$edit_form.hasClass("error-modal-border")) {
                this.$edit_form.removeClass("error-modal-border");
                this.$edit_form.addClass("nomal-modal-border");
            }
        },
    });

    /**********************************************************************/
    /*                           Dropdown class                           */
    /**********************************************************************/

    function Dropdown(field, element, options) {
        this.$element = element;
        this.field = field;
        this.options = options;
    }

    Dropdown.prototype = {
        constructor: Dropdown,

        init: function() {
            var default_options =
                {
                    menu: '<ul class="typeahead dropdown-menu"></ul>',
                    item: '<li><a href="#"></a></li>',
                    length: 10,
                    min_length: 1
                }
            this.options = $.extend({}, default_options, this.options);
            this.$menu = $(this.options.menu);
        },

        show: function() {
            var pos;
            if (this.$element) {
                pos = $.extend({}, this.$element.offset(), {
                    height: this.$element[0].offsetHeight
                });

                this.$menu
                    .appendTo($('body'))
                    .css({
                        top: pos.top + pos.height,
                        left: pos.left,
                        "min-width": this.$element.innerWidth(),
                        "max-width": $(window).width() - this.$element.offset().left - 20,
                        "overflow": "hidden"
                    })
                    .show()

                this.shown = true
                return this
            }
        },

        hide: function() {
            this.$menu.hide();
            this.$menu.detach();
            this.shown = false;
            return this;
        },

        destroy: function() {
            this.$element = undefined;
            this.$menu.remove();
        },

        get_items: function(event) {
            var items;
            if (this.$element) {
                this.query = this.$element.val()
                if (!this.query || this.query.length < this.min_length) {
                    return this.shown ? this.hide() : this
                }
                items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source
                return items ? this.process(items) : this
            }
        },

        lookup: function(event) {
            this.get_items(event);
        },

        process: function(items) {
            var that = this

            items = $.grep(items, function(item) {
                return that.matcher(item)
            })

            if (!items.length) {
                return this.shown ? this.hide() : this
            }

            return this.render(items.slice(0, this.length)).show()
        },

        matcher: function(item) {
            return true
        },

        highlighter: function(item) {
            var i = 0,
                query,
                result = item,
                strings;
            if (this.query) {
                strings = this.query.split(' ')
                for ( i = 0; i < strings.length; i++) {
                    query = strings[i];
                    if (query.indexOf('strong>') === -1 && query.length) {
                        query = query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')
                        result = result.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
                            return '<strong>' + match + '</strong>'
                        })
                    }
                }
            }
            return result
        },

        render: function(items) {
            var that = this

            items = $(items).map(function(i, values) {
                i = $(that.options.item).data('id-value', values[0]);
                i.find('a').html(that.highlighter(values[1]))
                return i[0]
            })

            items.first().addClass('active')
            this.$menu.html(items)
            return this
        },

        next: function(event) {
            var active = this.$menu.find('.active').removeClass('active'),
                next = active.next()

            if (!next.length) {
                next = $(this.$menu.find('li')[0])
            }

            next.addClass('active')
        },

        prev: function(event) {
            var active = this.$menu.find('.active').removeClass('active'),
                prev = active.prev()

            if (!prev.length) {
                prev = this.$menu.find('li').last()
            }

            prev.addClass('active')
        },

        listen: function() {
            this.$element
                .on('focus', $.proxy(this.focus, this))
                .on('blur', $.proxy(this.blur, this))
                .on('keypress', $.proxy(this.keypress, this))
                .on('keyup', $.proxy(this.keyup, this))

            if (this.eventSupported('keydown')) {
                this.$element.on('keydown', $.proxy(this.keydown, this))
            }

            this.$menu
                .on('click', $.proxy(this.click, this))
                .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
                .on('mouseleave', 'li', $.proxy(this.mouseleave, this))
        },

        eventSupported: function(eventName) {
            var isSupported = eventName in this.$element
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;')
                isSupported = typeof this.$element[eventName] === 'function'
            }
            return isSupported
        },

        move: function(e) {
            if (!this.shown) return

            switch (e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault()
                    break

                case 38: // up arrow
                    e.preventDefault()
                    this.prev()
                    break

                case 40: // down arrow
                    e.preventDefault()
                    this.next()
                    break
            }

            e.stopPropagation()
        },

        keydown: function(e) {
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40, 38, 9, 13, 27])
            this.move(e)
        },

        keypress: function(e) {
            if (this.suppressKeyPressRepeat) return
            this.move(e)
        },

        keyup: function(e) {
            if (!e.ctrlKey && !e.shiftKey) {
                switch (e.keyCode) {
                    case 40: // down arrow
                    case 38: // up arrow
                    case 16: // shift
                    case 17: // ctrl
                    case 18: // alt
                        break

                    case 9: // tab
                    case 13: // enter
                        if (!this.shown) {
                            if (e.keyCode === 13) {
                                this.enter_pressed();
                            }
                        }
                        else {
                            this.select()
                        }
                        break

                    case 27: // escape
                        if (!this.shown) return
                        this.field.update_controls();
                        if (this.$element) {
                            this.$element.select();
                        }
                        this.hide();
                        break

                    default:
                        this.lookup()
                }
                e.stopPropagation();
                e.preventDefault();
            }
        },

        focus: function(e) {
            this.focused = true
        },

        blur: function(e) {
            this.focused = false
            if (!this.mousedover && this.shown) this.hide()
        },

        click: function(e) {
            e.stopPropagation()
            e.preventDefault()
            this.select()
            this.$element.focus()
        },

        mouseenter: function(e) {
            this.mousedover = true
            this.$menu.find('.active').removeClass('active')
            $(e.currentTarget).addClass('active')
        },

        mouseleave: function(e) {
            this.mousedover = false
            if (!this.focused && this.shown) this.hide()
        }
    }

    /**********************************************************************/
    /*                        DropdownList class                          */
    /**********************************************************************/

    DropdownList.prototype = new Dropdown();
    DropdownList.prototype.constructor = DropdownList;

    function DropdownList(field, element, options) {
        Dropdown.call(this, field, element, options);
        this.init();
        this.source = this.field.lookup_values;
        this.options.length = this.source.length;
        this.listen();
    }

    $.extend(DropdownList.prototype, {

        matcher: function(item) {
            if (this.query) {
                return ~item[1].toLowerCase().indexOf(this.query.toLowerCase());
            }
            else {
                return true;
            }
        },

        select: function() {
            var $li = this.$menu.find('.active');
            if (this.field.owner && this.field.owner.is_changing && !this.field.owner.is_changing()) {
                this.field.owner.edit();
            }
            this.field.value = $li.data('id-value');
            return this.hide();
        },

        enter_pressed: function() {
            this.query = '';
            if (this.$element) {
                this.$element.focus();
            }
            this.process(this.source);
        }

    });

    /**********************************************************************/
    /*                     DropdownTypeahead class                        */
    /**********************************************************************/

    DropdownTypeahead.prototype = new Dropdown();
    DropdownTypeahead.prototype.constructor = DropdownTypeahead;

    function DropdownTypeahead(field, element, options) {
        Dropdown.call(this, field, element, options);
        this.init();
        this.source = this.options.source;
        this.lookup_item = this.options.lookup_item;
        this.listen();
    }

    $.extend(DropdownTypeahead.prototype, {

        lookup: function(event) {
            var self = this;
            clearTimeout(this.timeOut);
            this.timeOut = setTimeout(function() { self.get_items(event) }, 400);
        },

        select: function() {
            var $li = this.$menu.find('.active'),
                id_value = $li.data('id-value');
            this.lookup_item.locate(this.lookup_item._primary_key, id_value);
            this.lookup_item.set_lookup_field_value();
            return this.hide();
        },

        enter_pressed: function() {
            this.field.select_value();
        }

    });

///////////////////////////////////////////////////////////////////////////

    $.event.special.destroyed = {
        remove: function(o) {
            if (o.handler) {
                o.handler();
            }
        }
    };

    window.task = new Task();

})(jQuery);
