var stream = require('stream');
var xmpp = require('node-xmpp');
var util = require('util');

function Stream(connection, jid, id) {
  stream.Stream.call(this);
  this.id = id;
  this.remoteJID = (jid instanceof xmpp.JID) ? jid : new xmpp.JID(jid);
  this.blockSize = 8192;
  this.readable = false;
  this.writable = false;
  
  this.connection = connection;
  this.connection.on('stanza', this._onStanza.bind(this));
}

util.inherits(Stream, stream.Stream);

Stream.prototype.open = function() {
  this._openID = this.connection.generateID();
  var stanza = new xmpp.Element('iq', { id: this._openID, to: this.remoteJID.toString(), type: 'set'})
    .c('open', { 'xmlns': 'http://jabber.org/protocol/ibb', 'sid': this.id, 'block-size': this.blockSize });
  this.connection.send(stanza);
}

Stream.prototype._onStanza = function(stanza) {
  if (!stanza.is('iq')) { return; }
  if (stanza.attrs.type == 'result') { return this._handleResult(stanza); }
}

Stream.prototype._handleResult = function(stanza) {
  if (stanza.attrs.id == this._openID) {
    this.readable = true;
    this.writable = true;
    return this.emit('open');
  }
}


module.exports = Stream;
