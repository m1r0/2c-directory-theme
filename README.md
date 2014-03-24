##Features

* Directory search
* Multiple settings for search depth, font size and theme color
* Make your own customizations with CSS/Javascript/jQuery

##Requirements

* Apache(2.0.23+) enabled HTTP server
* PHP 5

## Installation

Copy `.htaccess` and the `theme` folder to the document root directory of your web server.

If you need the theme to be active in a sub directory, read the instructions below.

By default the theme is configured to work in the document root directory (`http://website.com/`). 
To change that to for example `http://website.com/projects/`, you need to do the following:
 * Edit `.htaccess` and replace `/theme` with `/projects/theme`
 * Edit `header.html` and replace `/theme` with `/projects/theme`
 * Edit `functions.js` and replace `root: '/'` with `root: '/projects/'`
