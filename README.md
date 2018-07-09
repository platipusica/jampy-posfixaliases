# Jam.py Application for Postfix Aliases (compatible with Python3)

[![Build Status](https://api.travis-ci.org/platipusica/jam-py.png?branch=master)](http://travis-ci.org/platipusica/jam-py)
![Python versions](https://img.shields.io/pypi/pyversions/python3-saml.svg)

The Problem
=============

Postfix mail server can be configured with a number of virtual maps, normally files in some folder called  domainxyz.virtual.
The file is just a plain text file maintained normally by the System Administrator. The file is converted into the Postfix binary format with: 

```
postmap domainxyz.virtual
```

The result is domainxyz.db 'hashed' file which is used by Posfix. 

In /etc/postfix/main.cf

the virtual aliases files would look something like:

```
.
.
virtual_alias_maps = ldap:/etc/postfix/ldap-maps.cf 
  hash:/etc/postfix/virtual_maps/domain1.virtual 
  hash:/etc/postfix/virtual_maps/domain2.virtual 
  .
  .
  
```


Now, imagine to maintain a hundreds of this files in an secure and source controlled fashion! Plus, imagine that this can be offloaded to the Junior Support Personnel or the Business Owner who 'owns' the domains in question so he/she can update the aliases by themself.

The Solution
=================

The Jam.py Postfix Aliases Application is my take on solving the problem of:

* The Application Access in an secure and monitored way
* The Complete Actions History on any virtual domain (or any other) 
* Virtual domain file Header and Footer (as bulk entries)
* Individual email aliases records on/off (with bulk entries)
* Custom Comments (ie Incident in ServiceNow) 
* Search on any records
* Saving the content in Postmap binary file


How does it work?
=================

This page is just a copy of https://github.com/platipusica/jampy-demo
for now as an tempate. The Aliases App will be done soon.

Please visit Heroku App:

TBA


About Jam.py
=================

With Jam.py you can create, customise, test and share awesome, fast, event-driven applications for SQLite, Oracle, MySQL, PostgreSQL and Firebird. All of that for free and no vendor lock-in!

How was this Demo published on Heroku?
------------------------------------
The Jam.py Demo you see on Heroku is just a Git repo made from the original Jam.py Demo with two files added: requirements.txt and Procfile.

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


Installation
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
pip install jam.py. 
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

You'll have the Demo App running at http://localhost:8001

## Create a new App

```
mkdir newapp
cd newapp
jam-project.py
python server.py
```
The new and empty App will run at http://localhost:8001

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
