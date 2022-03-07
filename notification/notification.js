var PushNotification = {
    PERMISSION: {
        GRANTED: 'granted',
        DENIED: 'denied',
        DEFAULT: 'default',
    },
    serviceWorkerFile: '',
    tagCounter: 0,
    useServiceWorker: function() {
        return (typeof this.serviceWorkerFile === 'string') && /.*\.js$/gi.test(this.serviceWorkerFile);
    },
    supported: function() {
        return "Notification" in window || ("serviceWorker" in navigator && "PushManager" in window);
    },
    isEnabled: function() {
        return Notification.permission == this.PERMISSION.GRANTED;
    },
    parseInput: function(argumentsArray) {
        // callback is always the last argument
        let callback = function() { return undefined; };

        if (argumentsArray.length && (typeof argumentsArray[argumentsArray.length - 1] === 'function')) {
            callback = argumentsArray.pop();
        }

        let title = null;
        let options = null;

        if (argumentsArray.length === 2) {
            title = argumentsArray[0];
            options = argumentsArray[1];
        } else if (argumentsArray.length === 1) {
            const value = argumentsArray.pop();
            if (typeof value === 'string') {
                title = value;
                options = {};
            } else {
                title = '';
                options = value;
            }
        }

        title = title || '';
        options = options || {};

        return { callback, title, options };
    },
    registerWorker: function(serviceWorkerFile) {
        this.serviceWorkerFile = serviceWorkerFile;
        return this;
    },
    requestPermission: function(callback) {
        callback = callback || function(){};
        if (this.isEnabled()) {
            callback(true);
        } else {
            let _self = this;
            Notification.requestPermission()
                .then(function (status) {
                    callback(_self.isEnabled());
                })
                .catch(function(error) {
                    console.error('[PushNotification][RequestPermission][Error] =>', error);
                    let errorMessage = typeof error === 'object' ? error.message : error;
                    alert('There are an error while requesting permission: ' + errorMessage);
                    callback(false, errorMessage);
                });
        }
    },
    defaultOptions: function() {
        return {
            body: '', // show main information right after title
            image: 'https://picsum.photos/200', //  add an image which is shown in expanded form below the body text of the desktop notification
            requireInteration: false, // true:  notification remains active until the user dismiss it or opens it
            silent: false, // show notification silently without any sound effect
            vibrate: true, // make the device vibrate if it supports vibration
            icon: 'https://picsum.photos/48'
        }
    },
    createAndShowNotification: function(title, options, callback) {
        options = Object.assign(this.defaultOptions(), options);
        let autoclose = 0;
        if (options.autoclose && (typeof options.autoclose === 'number')) {
            autoclose = options.autoclose;
        }
        // Defaults the notification icon as favicon.ico
        if (!options.icon) {
            options.icon = '/favicon.ico';
        }

        const onNotification = function (notification) {
            if (!notification) {
                console.log('[PushNotification][CreateAndShowNotification] => Notification instance is null.')
                callback(false, new Error('Notification instance is null.'));
                return;
            }
            // add onshow, onclick, onclose and onerror handlers on notifications
            if (options.onshow) {
                notification.onshow = options.onshow;
            }
            if (options.onclick) {
                notification.onclick = options.onclick;
            }
            if (options.onclose) {
                notification.onclose = options.onclose;
            }
            if (options.onerror) {
                notification.onerror = options.onerror;
            }

            const hideNotification = function () {
                notification.close();
            };

            if (autoclose) {
                setTimeout(hideNotification, autoclose);
            }

            callback(true, hideNotification);
        };

        if (this.useServiceWorker()) {
            if (!options.tag) {
                this.tagCounter++;
                options.tag = 'PushNotification-' + Date.now() + '-' + this.tagCounter;
            }

            navigator.serviceWorker.register(this.serviceWorkerFile).then(function(serviceWorkerRegistration) {
                console.log('[PushNotification][CreateAndShowNotification][Service Worker] => registered');
                console.log('[PushNotification][CreateAndShowNotification][Params] => ', { title: title, options: options });
                serviceWorkerRegistration.showNotification(title, options)
                    .then(function() {
                        serviceWorkerRegistration.getNotifications({ tag: options.tag })
                            .then(function(notifications) {
                                console.log('notifications => ', notifications)
                                if (notifications && notifications.length) {
                                    onNotification(notifications[0]);
                                } else {
                                    callback(false, new Error('Unable to find notification.'));
                                }
                            })
                            .catch(function(err) {
                                callback(false, err);
                            });
                    })
                    .catch(function(err) {
                        callback(false, err);
                    });
            }).catch(function(err) {
                callback(false, err);
            });
        } else {
            console.log('[PushNotification][Show] => ');
            try {
                if (options && options.hasOwnProperty('actions')) {
                    console.warn('[PushNotification][Show][Error] => Construct Notification: Actions are only supported for persistent notifications shown using ServiceWorkerRegistration.showNotification().');
                    delete options.actions;
                }
                onNotification(new Notification(title, options));
            } catch (error) {
                callback(false, error);
            }
        }
    },
    show: function() { // (title, options, callback)
        if (!this.supported()) {
            console.warn('[PushNotification][Show] => This browser does not support the notifications.');
            alert('This browser does not support the notifications.');
            return;
        }

        const argumentsArray = Array.prototype.slice.call(arguments, 0);
        if ((argumentsArray.length < 1) || (argumentsArray.length > 3)) {
            return;
        }

        let args = this.parseInput(argumentsArray);
        let title = args.title;
        let options = args.options;
        let callback = args.callback;
        var _self = this;

        this.requestPermission(function(granted) {
            if (!granted) {
                console.warn('[PushNotification][Show] => Notifications are not enabled.');
                callback(false, new Error('Notifications are not enabled.'));
                return;
            }
            _self.createAndShowNotification(title, options, callback);
        });
    },
};
