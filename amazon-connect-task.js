!function(n){var t={};function e(s){if(t[s])return t[s].exports;var i=t[s]={i:s,l:!1,exports:{}};return n[s].call(i.exports,i,i.exports,e),i.l=!0,i.exports}e.m=n,e.c=t,e.d=function(n,t,s){e.o(n,t)||Object.defineProperty(n,t,{enumerable:!0,get:s})},e.r=function(n){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})},e.t=function(n,t){if(1&t&&(n=e(n)),8&t)return n;if(4&t&&"object"==typeof n&&n&&n.__esModule)return n;var s=Object.create(null);if(e.r(s),Object.defineProperty(s,"default",{enumerable:!0,value:n}),2&t&&"string"!=typeof n)for(var i in n)e.d(s,i,function(t){return n[t]}.bind(null,i));return s},e.n=function(n){var t=n&&n.__esModule?function(){return n.default}:function(){return n};return e.d(t,"a",t),t},e.o=function(n,t){return Object.prototype.hasOwnProperty.call(n,t)},e.p="",e(e.s=2)}([function(n,t,e){"use strict";e.d(t,"b",(function(){return i})),e.d(t,"a",(function(){return s}));const s=connect.makeEnum(["URL"]),i=function(n,t){connect.assertNotNull(n,"Task contact object"),connect.assertNotNull(n.name,"Task name"),connect.assertNotNull(n.endpoint,"Task endpoint"),n.idempotencyToken=AWS.util.uuid.v4(),delete n.endpoint.endpointId,connect.core.getClient().call(connect.ClientMethods.CREATE_TASK_CONTACT,n,t)}},function(n,t,e){"use strict";e.d(t,"a",(function(){return k}));const s="NeverStarted",i="Starting",o="Connected",c="ConnectionLost",r="Ended",a="ConnectionLost",u="ConnectionGained",h="Ended",l="IncomingMessage";class d{constructor(n,t,e){d.baseInstance||(d.baseInstance=new b(e)),this.contactId=n,this.initialContactId=t,this.status=null,this.eventBus=new connect.EventBus,this.subscriptions=[d.baseInstance.onEnded(this.handleEnded.bind(this)),d.baseInstance.onConnectionGain(this.handleConnectionGain.bind(this)),d.baseInstance.onConnectionLost(this.handleConnectionLost.bind(this)),d.baseInstance.onMessage(this.handleMessage.bind(this))]}start(){return d.baseInstance.start()}end(){this.eventBus.unsubscribeAll(),this.subscriptions.forEach(n=>n.unsubscribe()),this.status=r}getStatus(){return this.status||d.baseInstance.getStatus()}onEnded(n){return this.eventBus.subscribe(h,n)}handleEnded(){this.eventBus.trigger(h,{})}onConnectionGain(n){return this.eventBus.subscribe(u,n)}handleConnectionGain(){this.eventBus.trigger(u,{})}onConnectionLost(n){return this.eventBus.subscribe(a,n)}handleConnectionLost(){this.eventBus.trigger(a,{})}onMessage(n){return this.eventBus.subscribe(l,n)}handleMessage(n){n.InitialContactId!==this.initialContactId&&n.ContactId!==this.contactId||this.eventBus.trigger(l,n)}}d.baseInstance=null;class b{constructor(n){this.status=s,this.eventBus=new connect.EventBus,this.initWebsocketManager(n)}initWebsocketManager(n){this.websocketManager=n,this.websocketManager.subscribeTopics(["aws/task"]),this.subscriptions=[this.websocketManager.onMessage("aws/task",this.handleMessage.bind(this)),this.websocketManager.onConnectionGain(this.handleConnectionGain.bind(this)),this.websocketManager.onConnectionLost(this.handleConnectionLost.bind(this)),this.websocketManager.onInitFailure(this.handleEnded.bind(this))]}start(){return this.status===s&&(this.status=i),Promise.resolve()}onEnded(n){return this.eventBus.subscribe(h,n)}handleEnded(){this.status=r,this.eventBus.trigger(h,{})}onConnectionGain(n){return this.eventBus.subscribe(u,n)}handleConnectionGain(){this.status=o,this.eventBus.trigger(u,{})}onConnectionLost(n){return this.eventBus.subscribe(a,n)}handleConnectionLost(){this.status=c,this.eventBus.trigger(a,{})}onMessage(n){return this.eventBus.subscribe(l,n)}handleMessage(n){let t;try{t=JSON.parse(n.content),this.eventBus.trigger(l,t)}catch(t){connect.getLog().error("Wrong message format: %s",n)}}getStatus(){return this.status}}var g=d;const p="INCOMING_MESSAGE",C="TRANSFER_FAILED",v="TRANSFER_SUCCEEDED",f="TRANSFER_INITIATED",E="CONNECTION_ESTABLISHED",I="CONNECTION_LOST",T="CONNECTION_BROKEN",_="TASK_EXPIRING",S="TASK_EXPIRED",w={"application/vnd.amazonaws.connect.event.transfer.initiated":f,"application/vnd.amazonaws.connect.event.transfer.succeeded":v,"application/vnd.amazonaws.connect.event.transfer.failed":C,"application/vnd.amazonaws.connect.event.expire.warning":_,"application/vnd.amazonaws.connect.event.expire.complete":S};class M{constructor(n){this.pubsub=new connect.EventBus,this.initialContactId=n.initialContactId,this.contactId=n.contactId,this.websocketManager=n.websocketManager}subscribe(n,t){this.pubsub.subscribe(n,t),connect.getLog().info(connect.LogComponent.TASK,"Subscribed successfully to eventName: %s",n)}connect(){return this._initConnectionHelper().then(this._onConnectSuccess.bind(this),this._onConnectFailure.bind(this))}getTaskDetails(){return{initialContactId:this.initialContactId,contactId:this.contactId}}unsubscribeAll(){this.pubsub.unsubscribeAll(),this.connectionHelper.end()}_triggerEvent(n,t){connect.getLog().debug(connect.LogComponent.TASK,"Triggering event for subscribers: %s",n).withObject({data:t,taskDetails:this.getTaskDetails()}),this.pubsub.trigger(n,t)}_onConnectSuccess(n){connect.getLog().info(connect.LogComponent.TASK,"Connect successful!");const t={_debug:n,connectSuccess:!0,connectCalled:!0};return this._triggerEvent(E,t),t}_onConnectFailure(n){const t={_debug:n,connectSuccess:!1,connectCalled:!0,metadata:this.sessionMetadata};return connect.getLog().error(connect.LogComponent.TASK,"Connect Failed").withException(t),Promise.reject(t)}_initConnectionHelper(){return this.connectionHelper=new g(this.contactId,this.initialContactId,this.websocketManager),this.connectionHelper.onEnded(this._handleEndedConnection.bind(this)),this.connectionHelper.onConnectionLost(this._handleLostConnection.bind(this)),this.connectionHelper.onConnectionGain(this._handleGainedConnection.bind(this)),this.connectionHelper.onMessage(this._handleIncomingMessage.bind(this)),this.connectionHelper.start()}_handleEndedConnection(n){this._triggerEvent(T,n)}_handleGainedConnection(n){this._triggerEvent(E,n)}_handleLostConnection(n){this._triggerEvent(I,n)}_handleIncomingMessage(n){const t=n.ContentType;w[t]&&this._triggerEvent(w[t],n),this._triggerEvent(p,n)}}class m{constructor(n){this.controller=n}onMessage(n){this.controller.subscribe(p,n)}onTransferSucceeded(n){this.controller.subscribe(v,n)}onTransferFailed(n){this.controller.subscribe(C,n)}onTransferInitiated(n){this.controller.subscribe(f,n)}onTaskExpiring(n){this.controller.subscribe(_,n)}onTaskExpired(n){this.controller.subscribe(S,n)}onConnectionBroken(n){this.controller.subscribe(T,n)}onConnectionEstablished(n){this.controller.subscribe(E,n)}connect(n){return this.controller.connect(n)}cleanUp(){this.controller.unsubscribeAll()}}const k={create:n=>{const t=new M(n);return new m(t)}}},function(n,t,e){"use strict";e.r(t),function(n){e.d(t,"TaskSession",(function(){return o}));var s=e(1),i=e(0);n.connect=n.connect||{},connect.TaskSession=s.a,connect.Agent.prototype.createTask||(connect.Agent.prototype.createTask=i.b),connect.ReferenceType=i.a;const o=s.a}.call(this,e(3))},function(n,t){var e;e=function(){return this}();try{e=e||new Function("return this")()}catch(n){"object"==typeof window&&(e=window)}n.exports=e}]);