"use strict";

/*
 * Embed HTML 5 Shiv,
 * if Internet Explorer 8 or below.
 */
if (
        navigator.appName === 'Microsoft Internet Explorer' &&
        new RegExp( "MSIE ([0-9]{1,}[\.0-9]{0,})" ).exec( navigator.userAgent ) !== null &&
        parseFloat( RegExp.$1 ) < 9
) {
    document.write( '<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>' );
}

/**
 * paper.js
 *
 * This handles the citations for any papers.
 * Citations are made using the '<cite>' tag.
 *
 * Two types of citations are supported. One
 * off citations made using the 'title' and
 * 'href' attributed.
 * 
 * For example:
 * 
 *  'Napolean of said that cats were the
 *   ultimate create for inspiring troops
 *   <cite title="Napoleans diary"
 *          href="http://www.napolean.org"
 *          page="19">
 *   </cite>'
 *  
 * The other is to use the 'library' function.
 * You can store a named citation,
 * and then append it later. For example:
 *
 * <script>
 *  library( 'nap', {
 *          title: 'Napoleans diary',
 *          href : 'http://www.napolean.org'
 *  })
 * </script>
 *
 *  'Napolean of said that cats were the
 *   ultimate create for inspiring troops
 *   <cite from="nap[19]"></cite>
 */
(function() {

    var bibliography = {};

    /*
     * The 'paper' object.
     */

    var paper = {};
    paper.library = function( name, info ) {
        if ( typeof name === 'string' ) {
            if ( typeof info === 'string' ) {
                info = { desc: info };
            }

            bibliography[ name ] = info;
        } else if ( arguments.length === 1 ) {
            for ( var k in name ) {
                if ( name.hasOwnProperty(k) ) {
                    this.library( k, name[k] );
                }
            }
        } else if ( arguments.length !== 0 ) {
            throw new Error( "unknown parameters given" );
        }

        return this;
    }

    paper.className = function( klass ) {
        withBody( function(body) {
            var klasses = klass.split( ' ' );

            for ( var i = 0; i < klasses.length; i++ ) {
                body.classList.add( klasses[i] );
            }
        } );

        return this;
    }

    paper.number = function( isNumbered ) {
        isNumbered = arguments.length === 0 || ( !! isNumbered );

        if ( isNumbered ) {
            withBody( function( body ) {
                body.classList.add( 'numbered' );
            } )
        } else {
            withBody( function(body) {
                body.classList.add( 'numbered' );
            } )
        }

        return this;
    }

    window.paper = paper;

    var withBody = function( fun ) {
        setTimeout( function() {
            fun( document.getElementsByTagName('body')[0] );
        }, 0 );
    }

    /*
     * Internal Paper building functions.
     */

    var findCitations = function( callback ) {
        var useCitationDoms = function( citeDoms ) {
            for ( var i = 0; i < citeDoms.length; i++ ) {
                var citeDom = citeDoms[i];

                callback(
                        citeDom.getAttribute( 'from' ) || citeDom.getAttribute( 'name' ),
                        citeDom.getAttribute( 'desc' ),
                        citeDom.getAttribute( 'href' ),
                        citeDom.getAttribute( 'page' )
                );
            }
        }

        useCitationDoms( document.getElementsByTagName('cite') );
    }

    var newReferenceDom = function( bibs, name, desc, href, page ) {
        var dom = document.createElement( 'div' );
        dom.className = 'reference';

        if ( name ) {
            if ( name.indexOf('[') !== -1 ) {
                var parts = name.split('[');
                name = parts[0];
                page = parts[1];
                page = page.replace(/\]$/, '');
            }

            if ( bibs.hasOwnProperty(name) ) {
                var info = bibs[ name ];

                desc = ( info.author || '' ) + ( info.desc || '' );
                href = info.href || '';
            } else {
                dom.className += ' not-found';
                dom.textContent = name;

                return dom;
            }
        }

        if ( page ) {
            var lastChar = desc.charAt( desc.length - 1 );

            if ( lastChar !== '.' && lastChar !== ',' ) {
                desc += ',';
            }

            if ( page.indexOf('p.') !== 0 ) {
                desc += ' p. ' + page;
            } else {
                desc += ' ' + page;
            }
        }

        dom.innerHTML = '<div class="num"></div>' + desc;

        if ( href ) {
            var hrefDom = document.createElement( 'a' );

            hrefDom.setAttribute( 'href', href );
            hrefDom.textContent = href;

            dom.appendChild( hrefDom );
        }

        return dom;
    }

    /**
     * = Find the dom to add references to, or create it if it doesn't exist.
     * = Find all citations.
     * = Add citations to the dom.
     * = If citations were added, and the dom was created by us, add it!
     */
    var initializeReferences = function() {
        var dom = document.getElementsByClassName( 'references' )[0];

        var domIsAdded = true;
        var addDom = false;
        if ( ! dom ) {
            domIsAdded = false;
            dom = document.createElement( 'references' );
        }

        findCitations( function(name, desc, href, page) {
            dom.appendChild(
                    newReferenceDom( bibliography, name, desc, href, page )
            );

            addDom = true;
        } );

        if ( ! domIsAdded && addDom ) {
            var addTo = document.getElementsByClassName('main')[0];
            if ( ! addTo ) {
                addTo = document.getElementsByTagName( 'body' )[0];
            }

            addTo.appendChild( dom );
        }
    }

    /**
     * Markdown automatically inserts code within a pre tag,
     * so it's like:
     *
     *  <pre>
     *      <code>
     *          // code here
     *      </code>
     *  </pre>
     *
     * This turns it from that, into a figure.
     * Such as:
     *
     *  <figure>
     *      <pre>
     *          // code here
     *      </pre>
     *  </figure>
     */
    var removeDuplicateCodes = function() {
        var codes = document.querySelectorAll( 'body > pre > code' );

        if ( codes ) {
            for ( var i = 0; i < codes.length; i++ ) {
                var code = codes[i];
                var pre = code.parentNode;

                pre.replaceChild( document.createTextNode(code.textContent), code );

                var figure = document.createElement( 'figure' );
                pre.parentNode.replaceChild( figure, pre );
                figure.appendChild( pre );
            }
        }
    }

    var initializePres = function( pres ) {
        if ( pres ) {
            for ( var i = 0; i < pres.length; i++ ) {
                var pre = pres[i];

                pre.innerHTML = trimLeftWhitespace( pre.innerHTML );
            }
        }
    }

    var trimLeftWhitespace = function( html ) {
        var text = html.
                replace( /^ *\n/, '' ).
                replace( /\n *$/, '' );

        var lines = text.split("\n");

        var minIndent = -1;

        for ( var j = 0; j < lines.length; j++ ) {
            var line = lines[j];
            var indent = 0;
            
            if ( line.length > 0 ) {
                for ( var k = 0; k < line.length; k++ ) {
                    if ( line.charAt(k) === ' ' ) {
                        indent++;
                    } else {
                        break;
                    }
                }

                if ( minIndent === -1 || minIndent > indent ) {
                    minIndent = indent;
                }
            }
        }

        if ( minIndent > 0 ) {
            for ( var j = 0; j < lines.length; j++ ) {
                lines[j] = lines[j].substring( minIndent );
            }

            return lines.join( "\n" );
        } else {
            return html;
        }
    }

    /*
     * Markdown Conversion
     */

    var appendScript = function( src, callback ) {
        var script = document.createElement('script')
        script.src = src

        if ( callback ) {
            script.onload = callback
        }

        script.onerror = function() {
            throw new Error("error loading script " + src)
        }

        appendHead( script );
    }

    var parseMarkdown = function( markdown, converter ) {
        converter = converter || new Markdown.Converter();

        return converter.makeHtml(
                trimLeftWhitespace( markdown )
        )
    }

    var markdownsToHTML = function( elements ) {
        var converter = new Markdown.Converter()

        for ( var i = 0; i < elements.length; i++ ) {
            var el = elements[i];

            el.innerHTML = parseMarkdown( el.innerHTML, converter );
        }
    }

    var appendHead = function() {
        var head = document.getElementsByTagName( 'head' )[0];

        appendArr( head, arguments );
    }

    var appendArr = function( el, arr ) {
        for ( var i = 0; i < arr.length; i++ ) {
            var val = arr[i];

            if ( val instanceof HTMLElement ) {
                el.appendChild( val );
            } else {
                el.insertAdjacentHTML( 'beforeend', val );
            }
        }
    }

    var grabTitle = function() {
        if ( ! window.title ) {
            setTimeout( function() {
                var title = document.getElementsByTagName( 'h1' )[0];

                if ( title ) {
                    window.title = title.textContent;
                    appendHead( '<title>' + title.textContent + '</title>' );
                }
            }, 0 );
        }
    }

    /*
     * If external executing scripts, also contain content,
     * then run the content.
     */
    var executeExternalScriptExtras = function() {
        var scripts = document.getElementsByTagName( 'script' );

        for ( var i = 0; i < scripts.length; i++ ) {
            var script = scripts[i];

            if ( script.src && script.src !== '#' ) {
                var newScript = document.createElement( 'script' );
                newScript.innerHTML = script.innerHTML;

                appendHead( newScript );
            }
        }
    }

    /*
     * Load page
     */

    document.getElementsByTagName('html')[0].style.visibility = 'hidden';

    /*
     * This section works out where this script is located.
     * That is so the 'lib' folder can be renamed.
     */
    var scripts = document.getElementsByTagName( 'script' );
    var sourceDir = '';
    for ( var i = scripts.length-1; i >= 0; i-- ) {
        var script = scripts[i];
        if ( script.src ) {
            sourceDir = script.src.replace( /\/?[^\/]+$/, '' ) + '/';
            break;
        }
    }

    /*
     * Finally, make the page once it's all loaded.
     */
    window.onload = function() {
        appendHead(
                '<meta http-equiv="Content-Type" content="text/html;charset=UTF-8">',
                '<meta http-equiv="X-UA-Compatible" content="IE=edge">',

                '<link rel="stylesheet" href="' + sourceDir + 'paper.css?=' + Date.now() + '">'
        );

        appendScript( sourceDir + 'markdown.js', function() {
            var header = document.getElementsByTagName('header')[0];
            var headerMD = '';

            if ( header ) {
                headerMD = header.innerHTML;
            }

            markdownsToHTML( document.getElementsByTagName('body') );

            markdownsToHTML( document.getElementsByClassName('abstract') );
            markdownsToHTML( document.getElementsByClassName('main')     );
            markdownsToHTML( document.getElementsByClassName('markdown') );

            if ( header ) {
                document.getElementsByTagName( 'header' )[0].innerHTML =
                        parseMarkdown( headerMD );
            }

            grabTitle();

            removeDuplicateCodes();

            initializePres( document.getElementsByTagName('pre') );

            /*
             * Ensure we run scripts *before* references,
             * because the scripts may add to the references library.
             */
            executeExternalScriptExtras();
            initializeReferences();

            setTimeout( function() {
                document.getElementsByTagName( 'html' )[0].style.visibility = 'visible';
            }, 0 );
        });
    }
})();
