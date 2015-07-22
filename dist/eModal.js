/* ========================================================================
 * SaRibe: eModal.js v1.1.02
 * http://saribe.github.io/eModal
 * ========================================================================
 * Copyright Samuel Ribeiro.
 * Licensed under.
 * ======================================================================== */

; (function (define) {
    define(['jquery'], function ($) {
        /// <summary>
        /// @params allowed elements:
        ///     buttons  {array}:           An array of objects to configure buttons to modal footer; only able if message == string
        ///     css      {object}:          css objext try apply into message body; only able if message == string
        ///     loading  {bool}:            set loading progress as message.
        ///     message  {string|object}:   The body message string or the html element. eg: $(selector);
        ///     size     {string}:          sm || lg -> define the modal size.
        ///     subtitle {string}:          The header subtitle string. This apper in a smaller text.
        ///     title    {string}:          The header title string.
        ///     useBin   {bool}:            set message as recycable.
        /// </summary>
        /// <param name="params"            >Modal options parameters os string body message.</param>
        /// <param name="title"             >The string header title or a flag to set default params.</param>
        /// <returns type="jQuery Element"  >The modal element.</returns>

        //The modal element UX and events.
        var defaultSettings = {
            allowContentRecycle: true,
            size: '',
            loadingHtml: '<h5>Loading...</h5><div class=progress><div class="progress-bar progress-bar-striped active" role=progressbar aria-valuenow=100 aria-valuemin=0 aria-valuemax=100 style="width: 100%"><span class=sr-only>100% Complete</span></div></div>',
            title: 'Attention'
        };
        var $modal;
        var bin = 'recycle-bin';
        var div = '<div style="position: relative;">';
        var footerId = 'eModalFooter';
        var lastParams = {};
        var modalBody = 'modal-body';
        var options = {};
        var recModalContent = 'rec-modal-content';
        var size = { sm: 'sm', lg: 'lg' };
        var tmpModalContent = 'tmp-modal-content';

        return {
            ajax: ajax,
            alert: alert,
            close: close,
            confirm: confirm,
            emptyBin: emptyBin,
            iframe: iframe,
            prompt: prompt,
            setEModalOptions: setEModalOptions,
            setModalOptions: setModalOptions,
            size: size,
            version: '1.1.02'
        };

        //#region Public Methods
        function ajax(data, title, callback) {
            /// <summary>Gets data from url to eModal body</summary>
            /// <param name="data"></param>
            /// <param name="title"></param>
            /// <returns type=""></returns>

            var params = {
                callback: data.callback || callback,
                loading: true,
                title: data.title || title || defaultSettings.title,
                url: data.url || data
            };

            if (data.url) { $.extend(params, data); }

            return alert(params, title)
                .find('.' + modalBody)
                .load(params.url, error)
                .closest('.modal-dialog');

            function error(responseText, textStatus) {
                if (textStatus === 'error') {
                    var msg = '<div class="alert alert-danger">' +
                        '<strong>XHR Fail: </strong>Url [ ' + params.url + '] load fail.' +
                        '</div>';
                    alert(msg, 'Loading: ' + params.title);
                } else {
                    if (params.callback) { params.callback($modal); }
                }
            }
        }

        function alert(params, title) {
            /// <summary>Non blocking alert whit bootstrap.</summary>
            /// <param name="params"></param>
            /// <param name="title"></param>
            /// <returns type=""></returns>

            setup(params, title);

            var $message = $(div).append(getMessage(params), getFooter(params.buttons));

            return build($message, params);
        }

        function confirm(params, title, callback) {
            /// <summary></summary>
            /// <param name="params"></param>
            /// <param name="title"></param>
            /// <param name="callback"></param>
            /// <returns type=""></returns>

            var label = {
                OK: 'Cancel',
                True: 'False',
                Yes: 'No'
            };
            var defaultLable = 'OK';

            return alert({
                buttons: [
                    { close: true, click: click, text: label[params.label] ? label[params.label] : label[defaultLable], style: 'danger' },
                    { close: true, click: click, text: label[params.label] ? params.label : defaultLable }
                ],
                message: params.message || params,
                onHide: click,
                size: params.size,
                title: params.title || title
            });

            function click(ev) {
                var fn = params.callback || callback;

                close();

                if (typeof fn === 'function') {
                    var key = $(ev.currentTarget).html();
                    return fn(label[key] ? true : false);
                }

                throw new Error('No callback provided to execute confim modal action.');
            }
        }

        function iframe(params, title, callback) {
            var html = ('<div class=modal-body style="position: absolute;width: 100%;background-color: rgba(255,255,255,0.8);height: 100%;">%1%</div>'+
                        '<iframe class="embed-responsive-item" src="%0%" style="width:100%;height:75vh;"/>')
                .replace('%0%', params.message || params.url || params)
                .replace('%1%', defaultSettings.loadingHtml);

            var message = $(html)
                .load(iframeReady);

            return alert({
                buttons: params.buttons || false,
                message: message,
                size: params.size || size.lg,
                title: params.title || title
            });
            //////////

            function iframeReady() {
                $(this)
                    .parent()
                    .find('div')
                    .fadeOut(function() {
                        $(this).remove();
                    });

                callback = params.callback || callback;
                if (typeof (callback) === 'function') {
                    callback(message);
                }
            }
        }

        function emptyBin() {
            /// <summary>Remove all dom element cached in document.</summary>
            /// <returns type="Array">Array with removed elemens.</returns>

            return $('#' + bin + ' > *').remove();
        }

        function prompt(data, title, callback) {
            var params = {};
            if (typeof data === 'object') {
                $.extend(params, data);
            }
            else {
                params.callback = callback;
                params.message = data;
                params.title = title;
            }

            if (params.buttons) {
                var btn;
                for (var i = 0, k = params.buttons.length; i < k; i++) {
                    btn = params.buttons[i];
                    btn.style = btn.style ? btn.style + ' pull-left' : 'default pull-left';
                    btn.type = btn.type || 'button';
                }
            }

            var buttons = getFooter([
                { close: true, type: 'reset', text: 'Cancel', style: 'danger' },
                { close: false, type: 'submit', text: 'OK' }
            ].concat(params.buttons || []));

            params.buttons = false;
            params.onHide = submit;

            params.message = $('<form role=form style="margin-bottom:0;">' +
                    '<div class=modal-body>' +
                    '<label for=prompt-input class=control-label>' + (params.message || '') + '</label>' +
                    '<input type=text class=form-control id=prompt-input required autofocus value="' + (params.value || '') + (params.pattern ? '" pattern="' + params.pattern : '') + '">' +
                    '</div></form>')
                .append(buttons)
                .on('submit', submit);

            return alert(params);

            function submit(ev) {
                var fn = params.callback || callback;

                close();

                if (typeof fn === 'function') {
                    return fn($(ev.currentTarget).html() === 'Cancel' ? null : $modal.find('input').val());
                }

                throw new Error('No callback provided to execute prompt modal action.');
            }
        }

        function setEModalOptions(overrideOptions) {
            /// <summary></summary>
            /// <param name="overrideOptions"></param>
            /// <returns type=""></returns>

            return $.extend(defaultSettings, overrideOptions);
        }

        function setModalOptions(overrideOptions) {
            /// <summary></summary>
            /// <param name="overrideOptions"></param>
            /// <returns type=""></returns>

            $modal && $modal.remove();

            return $.extend(options, overrideOptions);
        }

        function close() {
            ///<summary>Close the modal. </summary>
            if ($modal) {
                $modal.off('hide.bs.modal').modal('hide');
            }
            return $modal;
        }
        //#endregion

        //#region Private Logic
        function build(message) {
            $modal.find('.modal-content')
               .append(message);

            return $modal.modal(options);
        }

        function getModalInstance() {
            /// <summary>
            /// Return a new modal object if is the first request or the already created model.
            /// </summary>
            /// <returns type="jQuery Object">The model instance.</returns>

            if (!$modal) {
                //add recycle bin container to document
                if (!document.getElementById(bin)) {
                    $('body').append($(div).prop('id', bin).hide());
                }

                $modal = createModalElement();
            }

            return $modal;

            function createModalElement() {
                /// <summary></summary>
                /// <returns type="jQuery object"></returns>

                return $('<div class="modal fade" tabindex="-1">'
                + '<div class=modal-dialog>'
                + '<div class=modal-content>'
                + ' <div class=modal-header><button type=button class="x close" data-dismiss=modal><span aria-hidden=true>&times;</span><span class=sr-only>Close</span></button><h4 class=modal-title></h4></div>'
                + '</div>'
                + '</div>'
                + '</div>')
                .on('hidden.bs.modal', recycleModal)
                .on('click', 'button.x', function (ev) {
                    var btn = $(ev.currentTarget);

                    if (btn.prop('type') !== 'submit')
                        return $modal.modal('hide');

                    try {
                        if (btn.closest('form')[0].checkValidity())
                            return close();
                    } catch (e) {
                        return close();
                    }

                    return $modal;
                });
            }
        }

        function getFooter(buttons) {
            /// <summary></summary>
            /// <returns type=""></returns>

            if (buttons === false) { return ''; }

            var messageFotter = $(div).addClass('modal-footer').prop('id', footerId);
            if (buttons) {
                for (var i = 0, k = buttons.length; i < k; i++) {
                    var btnOp = buttons[i];
                    var btn = $('<button>').addClass('btn btn-' + (btnOp.style || 'info'));

                    for (var index in btnOp) {
                        if (btnOp.hasOwnProperty(index)) {
                            switch (index) {
                                case 'close':
                                    //add close event
                                    if (btnOp[index]) {
                                        btn.attr('data-dismiss', 'modal')
                                           .addClass('x');
                                    }
                                    break;
                                case 'click':
                                    //click event
                                    btn.click(btnOp.click);
                                    break;
                                case 'text':
                                    btn.html(btnOp[index]);
                                    break;
                                default:
                                    //all other possible html attributes to button element
                                    btn.attr(index, btnOp[index]);
                            }
                        }
                    }

                    messageFotter.append(btn);
                }
            } else {
                //if no buttons defined by user, add a standard close button.
                messageFotter.append('<button class="x btn btn-info" data-dismiss=modal type=button>Close</button>');
            }
            return messageFotter;
        }

        function getMessage(params) {
            /// <param name='params'>object with opions</param>
            /// <returns type='jQuery'>eModal body jQuery objec</returns>

            var $message;
            var content = params.loading ?
                defaultSettings.loadingHtml :
                (params.message || params);

            if (content.on || content.onclick) {
                $message = params.clone === true ?
                    $(content).clone() :
                    $(content);

                $message.addClass(params.useBin && !params.loading ? recModalContent : tmpModalContent);
            } else {
                $message = $(div).addClass(modalBody)
                    .html(content);
            }

            return params.css && (params.css !== $message.css && $message.css(params.css)), $message;
        }

        function recycleModal() {
            /// <summary>
            /// Move content to recycle bin if is a DOM object defined by user,
            /// delete itar if is a simple string message.
            /// All modal messages can be deleted if default setting "allowContentRecycle" = false.
            /// </summary>

            if (!$modal) return $modal;

            var $content = $modal.find('.' + recModalContent).removeClass(recModalContent)
                   .appendTo('#' + bin);

            $modal
                .off('hide.bs.modal')
                .find('.modal-content > div:not(:first-child)')
                .remove();

            if (!defaultSettings.allowContentRecycle || lastParams.clone) {
                $content.remove();
            }

            return $modal;
        }

        function setup(params, title) {
            /// <summary></summary>
            /// <param name='params'>eModal body message or object with opions</param>
            /// <param name='title'>Modal header title</param>
            /// <returns type='jQuery'>eModal jQuery objec</returns>

            if (!params) throw new Error('Invalid parameters!');

            recycleModal();
            lastParams = params;

            // Lazy loading
            var $ref = getModalInstance();

            //#region change size
            $ref.find('.modal-dialog')
                .removeClass('modal-sm modal-lg')
                .addClass(params.size ? 'modal-' + params.size : defaultSettings.size);
            //#endregion

            //#region change title
            $ref.find('.modal-title')
                .html((params.title || title || defaultSettings.title) + ' ')
                .append($('<small>').html(params.subtitle || ''));
            //#endregion

            $ref.on('hide.bs.modal', params.onHide);
            return $ref;
        }
        //#endregion
    });
}(typeof define == 'function' && define.amd ? define : function (n, t) {
    typeof window.module != 'undefined' && window.module.exports ?
        window.module.exports = t(window.require(n[0])) :
        window.eModal = t(window.jQuery);
}));
