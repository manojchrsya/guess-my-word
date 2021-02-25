/* eslint-disable */
$(function () {
  var socket = io();
  var user = {};
  var GUESSMYWORD = {
    init: function() {
      this.groupAdded();
      this.groupJoined();
    },
    groupAdded() {
      socket.on('group added', (data) => {
        console.log(data);
        if (data.shareLink) {
          $("#uniqueGameCode").val(data.shareLink);
        }
        $("#login, #board").addClass('d-none');
        $("#lobby").removeClass('d-none');
      });
    },
    groupJoined() {
      socket.on('group joined', (data) => {
        console.log(data);
        $("#login, #board").addClass('d-none');
        $("#lobby").removeClass('d-none');
      });
    }
  }
  $('.create-group').on('click', function(e) {
    e.preventDefault();
    user.name = $('.username').val();
    if (!user.name) {
      $(".instructions").removeClass('d-none').text('Please enter your name!!');
      return false
    }
    $(".instructions").addClass('d-none').text('');
    user.id = Math.random().toString(36).substring(2);
    socket.emit('create group', user);
  })

  $(".join-group").on('click', function(e) {
    e.preventDefault();
    user.name = $('.username').val();
    if (!user.name) {
      $(".instructions").removeClass('d-none').text('Please enter your name!!');
      return false
    }
    $(".instructions").addClass('d-none').text('');
    user.id = Math.random().toString(36).substring(2);
    var groupId = $("#uniqueGameCode").attr('data-groupId');
    socket.emit('join group', { ...user, groupId });
  });

  GUESSMYWORD.init();
});
