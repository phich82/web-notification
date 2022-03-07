// Refer: https://notifyjs.jpillora.com/

var Notify = {
    success: function(content) {
        $.notify(content, "success");
    },
    info: function(content) {
        $.notify(content, "info");
    },
    warn: function(content) {
        $.notify(content, "warn");
    },
    error: function(content) {
        $.notify(content, "error");
    },
    toElement: function(identity, content, position) {
        $(identity).notify(content, { position: position || 'right' });
    }
};
