// Generated by CoffeeScript 1.3.1
var app, express, fs, gzip, racer, shared, store;

express = require('express');

gzip = require('connect-gzip');

fs = require('fs');

racer = require('racer');

shared = require('./shared');

racer.use(require('racer-db-mongo'));

app = express.createServer().use(express.favicon()).use(gzip.staticGzip(__dirname));

store = racer.createStore({
  listen: app,
  db: {
    type: 'Mongo',
    uri: 'mongo://localhost/derby-todos'
  }
});

racer.js({
  entry: __dirname + '/client.js'
}, function(err, js) {
  if (err) {
    throw err;
  }
  return fs.writeFileSync(__dirname + '/script.js', js);
});

app.get('/', function(req, res) {
  return res.redirect('/racer');
});

app.get('/:groupName', function(req, res) {
  var groupName, groupTodosQuery, model;
  model = store.createModel();
  groupName = req.params.groupName;
  groupTodosQuery = model.query('todos').where('groupId').equals(groupName);
  return model.subscribe("groups." + groupName, groupTodosQuery, function(err, group, todos) {
    var todoList;
    model.ref('_group', group);
    todoList = model.refList('_todoList', todos, '_group.todoIds');
    if (!group.get()) {
      group.setNull({});
      todoList.push({
        groupId: groupName,
        completed: true,
        text: 'This one is done already'
      }, {
        groupId: groupName,
        completed: false,
        text: 'Example todo'
      }, {
        groupId: groupName,
        completed: false,
        text: 'Another example'
      });
    }
    return model.bundle(function(bundle) {
      var listHtml, todo;
      listHtml = ((function() {
        var _i, _len, _ref, _results;
        _ref = model.get('_todoList');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          todo = _ref[_i];
          _results.push(shared.todoHtml(todo));
        }
        return _results;
      })()).join('');
      return res.send("<!DOCTYPE html>\n<title>Todos</title>\n<link rel=stylesheet href=style.css>\n<body>\n<div id=overlay></div>\n<!-- calling via timeout keeps the page from redirecting if an error is thrown -->\n<form id=head onsubmit=\"setTimeout(todos.addTodo, 0);return false\">\n  <h1>Todos</h1>\n  <div id=add><div id=add-input><input id=new-todo></div><input id=add-button type=submit value=Add></div>\n</form>\n<div id=dragbox></div>\n<div id=content><ul id=todos>" + listHtml + "</ul></div>\n<script>init=" + bundle + "</script>\n<script src=https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js></script>\n<script src=https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min.js></script>\n<script src=script.js></script>");
    });
  });
});

app.listen(3012);

console.log('Go to http://localhost:3012/racer');
