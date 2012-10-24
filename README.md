LICENSE
=======
[LGPL](http://www.gnu.org/licenses/lgpl.html)

Introduction
============
Easytype plugin restricts user's input to a pre-defined pattern. It guides users to type legal characters only and
ensures that the input follows the format.

Please visit following website for details:

[http://chance-an.github.com/easytype](http://chance-an.github.com/easytype)

Download
========

Download it from:
https://github.com/downloads/chance-an/easytype/easytype-min.js

Usage
=====

Easytype defines a simple convention for a mask pattern, which consists of masks and fixed text fragments. For masks,
\# is for numbers, $ could be for text (technically an alpha-numeric value), any other character is taken literally as a
fixed text fragment.

Examples
--------

* A Social Security Number mask: ###-##-####.
* A US phone mask: could be (###) ###-####.
* A date: ##/##/####.
* Software Serial Number: $$$$-$$$$-$$$$-$$$$.
* Any pattern you need!: If(####){$$$$$$}eLsE{$$$$$$}.

etc..

Before Easytype plugin is enabled, the code for the plugin must be imported first. Usually, it appears after the
importation of JQuery library.

```html
<script src="http://code.jquery.com/jquery-1.6.4.js" type="text/javascript"></script>
<script src="{path_to_the_plugin}/easytype-min.js" type="text/javascript"></script>
```

To apply a pattern to an input control, after acquiring the input control using JQuery selector, simply call easytype()
method and toss over the desired pattern as a string.

Example
-------

```javascript
$('#phone_number').easytype('(###) ###-####');
```
To get the value of the input control, still use $('#phone_number').val(). Nothing changed!
