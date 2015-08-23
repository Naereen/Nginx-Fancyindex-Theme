# Nginx-Fancyindex-Theme
A responsive theme for Nginx Fancyindex module. Minimal, modern and simple. Comes with a search form, aims to handle thousands of files without any problems. The fancyindex module an be found [here](https://github.com/aperezdc/ngx-fancyindex)

# Usage

1. Make sure you have the fancyindex module compiled with nginx, either by compiling it yourself or installing nginx-extras.
2. Include the contents fancyindex.conf in your location directive in your nginx config.
3. Move the `Nginx-Fancyindex-Theme` folder to the root of the directory.
4. Restart/reload nginx.

# Configuration

A standard config looks something like this:

```
fancyindex on;
fancyindex_localtime on;
fancyindex_exact_size off;
fancyindex_header "/Nginx-Fancyindex-Theme/header.html";
fancyindex_footer "/Nginx-Fancyindex-Theme/footer.html";
fancyindex_ignore "examplefile.html; # Ignored files will not show up in the directory listing, but will still be public. 
fancyindex_ignore "Nginx-Fancyindex-Theme; # Making sure folder where files are don't show up in the listing. 
fancyindex_name_length 255; # Maximum file name length in bytes, change as you like.
```

