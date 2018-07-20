# Jam.py Application for Postfix Aliases (compatible with Python3)

[![Build Status](https://api.travis-ci.org/platipusica/jam-py.png?branch=master)](http://travis-ci.org/platipusica/jam-py)
![Python versions](https://img.shields.io/pypi/pyversions/python3-saml.svg)

The Problem
=============

Postfix mail server can be configured with a number of virtual maps, normally files in some folder called for example domainxyz.virtual (see http://www.postfix.org/postmap.1.html).

In /etc/postfix/main.cf Postfix configuration, the virtual aliases files might look something like:

```
.
.
virtual_alias_maps = ldap:/etc/postfix/ldap-maps.cf 
  hash:/etc/postfix/virtual_maps/domain1.virtual 
  hash:/etc/postfix/virtual_maps/domain2.virtual 
  hash:/etc/postfix/virtual_maps/domain3.virtual 
  .
  .
  .
  hash:/etc/postfix/virtual_maps/domainxyz.virtual 
```

The file is just a plain text file maintained by the System Administrator. The file is converted into the Postfix 'hashed' binary format with below command: 

```
postmap domainxyz.virtual
```

The result is domainxyz.db 'hashed' file which is used by Postfix. 



Now, imagine to maintain a hundreds of this files in an secure and source controlled fashion! That is a lot of work, and prone to errors, typos and what not.
However, imagine that this can be offloaded to the Junior Support Personnel or the Business Owner who 'owns' the domains in question, so she/he can update the aliases by themself! Interested? 

The Solution
=================

The Jam.py Postfix Aliases Application is my take on solving the problem of:

* The Application Access in an secure and monitored way over the Web
* The Complete Actions History on any virtual domain (or any other part of App) 
* Virtual domain file Header and Footer (as bulk entries, only Admin can modify)
* Individual email aliases records on/off (with bulk entries, User can modify)
* Custom Comments (ie Incident in Service Ticketing Software) 
* Search on any records
* Saving the content in Postmap binary file
* Reports and Dashboard


How does it work?
=================

Please visit Heroku App:

http://jampy-aliases.herokuapp.com/

Here, you're presented with the Domain Email Aliases. On the Catalogs Menu is everthing what normal User shouldn't access, Footers, Headers, Files Path and Users. The File Path here is just an example for each Domain in question. We need a Header to *Warn* the console users who might manually update the file, and we also need Footer to add any extra aliases normal User can't see (like mailman aliases, etc).

After some domain is updated, the new entry added, deleted or aliases disabled, by click on "Save", the Application automaticaly creates the new virtual file (overwrites the old one), and executes postmap for the same file.

The file domain3.virtual would look like:

```
#WARNING GENERATED FILE...                              <-- this is a file Header
aliases go in here:
.
.

# WARNING WARNING WARNING                               <-- this is a file Footer
# This entry must be the last entry in the file !!!     <-- this is a Footer
# Catch-all for non-existent Addresses                  <-- this is a Footer
# WARNING WARNING WARNING                               <-- this is a Footer
@doman3.com	devnull                                      <-- this is a Footer
```

and it would be written in /etc/postfix/virtual_maps/ folder. The 'hashed' file would be created there as well.

This is the first release so please bear with me if there are any inconsistencies.


How to run in *your* environment?
==================================

Download this repo, and run it. The App will be in read only mode. Change the file jam/server_classes.py and remove lines 194-198 to remove read only. If you like the App, completely remove the jam folder, which is here only for r/o App, install the latest Jam.py (with Python virtenv as a preference), and try the App again.

If all good, add some Virtual Aliases details (like file location matching details in /etc/postfix/main.cf), and Users on Catalogs menu. After that, add some Email aliases. 
Click on "Save" will create or overwrite domainxyz.virtual file and execute "postmap domainxyz.virtual", whatever the domainxyz is. Postfix will pickup the changes immediately. This code is commented out atm, and you can find it in Task Server module when open App Builder on Demo.

The above is based on assumption that the App runs as root.  If the App is running with mod_wsgi and Apache, the OS permissions is a problem as Apache usually runs as non root user. One option is to change the permissions on files/folders to match the Apache user. For sure *all* Apache files can be overwritten with this way. The other option might include writing files somewhere, and picking the files by cron. 

Further Enhancements 
=================

Further enhancements would be beneficial like having a Dashboard with aliases analytics. Also the custom reports with the same.
The AD authentication is supported out of the box. Please raise an request with a Python version needed and will be emailed to you.

About Jam.py
=================

With Jam.py you can create, customise, test and share awesome, fast, event-driven applications for SQLite, Oracle, MySQL, PostgreSQL and Firebird. All of that for free and no vendor lock-in!

How was this Demo published on Heroku?
------------------------------------
The Aliases App you see on Heroku is just the Jam.py Project with two files added: requirements.txt and Procfile.

Then the Heroku account was open, jampy App created, Git repo linked and deployed. In 10 seconds it magically appeared as a live Web site. Enjoy.


Why using Jam.py?
------------------------------------
DRY principle! Don't repeat yourself, do it once, do it well.

With Jam.py Application Builder, you can resolve a specific business problem. Out of the box Jam is providing: fast access to underlying databases, security, authentication, validation, calendars, multi languages, all of that with minimum of coding needed. Being Python framework, it is extensible and flexible.

**“All in the browser” framework**
* Internet Browser IDE
* Code Editor with Syntax Highlighting and Code Completion
* No declarative options, you are in charge.
* Instant WYSIWYG
* Application lifecycle tracking.
* SQL and stored procedures supported for major vendors.
* Integrate any Python library with no contract lock-in and reduce cost instantly.
* Bootstrap, JQuery, JS, all in here. Use it with no fuss and learning this massive libraries.
* Create rich, informative reports, due to band-oriented report generation based on LibreOffice templates.

**Event driven grids**

* Event driven grids enable you to easily manipulate data simply by clicking on a cell and editing its value.
* Event driven data-aware visual interface controls makes the framework flexible and powerful.
* Edit your data in the grid, as you would in any Desktop spreadsheet application.
* Create the master-detail table with breeze, utilising templates for displaying, which is no more than a copy/paste. Easy. * Again, no declarative methods, the control is with you as it should be.

**jsCharts or any charting libraries**

* Locked-in with a vendor charting capabilities? Never again. Use free libraries as jsChart, at.al.
* Use the same charting capabilities on your mobile devices, once for all.
* Visualise charts immediately after you create/import tables, with a few lines of code. Simple and effective.
* Analyzing/displaying BIG data? Add free Python lib's, build a Jam Web Form with parameters, execute on the server. 
* Profit.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.


Jam.py Installation
------------

### Dependencies

 * python 2.7 // python 3.6
 * For MySQL database access: mysqlclient, libmysqlclient-dev
 * For Oracle database access: cx_oracle
 * For Firebird database access: fdb
 * For Jam.py Reports editing/creation: LibreOffice

## Installing an official release with pip


The easiest is to use the standalone pip installer.

If you’re using Linux, Mac OS X or some other flavor of Unix, enter the command:
```
sudo pip install jam.py 
```
at the shell prompt. If you’re using Windows, start a command shell with administrator privileges and run the command:
```
pip install jam.py
```
This will install Jam.py in your Python installation’s site-packages directory.


## Installing an official release manually

Download the package archive from https://github.com/jam-py/jam-py/tree/master

Create a new directory and unzip the archive there.

From the above directory, enter the command:

```
sudo python setup.py install
```

This will install Jam.py in your Python installation’s site-packages directory.

## Running the Demo App

Navigate to jam.py installation demo folder, enter the command:
```
python server.py
```

You'll have the Demo App running at http://localhost:8080

## Create a new App

```
mkdir newapp
cd newapp
jam-project.py
python server.py
```
The new and empty App will run at http://localhost:8080

Please visit http://jam-py.com/docs/intro/index.html for complete Getting Started Introduction.


## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.



## Authors

* **Andrew Yushev** - [Jam-py.com](https://github.com/jam-py)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the BSD License.

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc
