/* eslint-disable */
$(function () {
  var socket = io();
  var user = {};
  const templates = {
    profile: function(user) {
      return `<div class="profileImage">
        <img class="img-responsive img-circle" width="100%" src="${user.profilePic}">
        <p class="text-center">${user.name}</p>
      </div>`;
    }
  }
  var GUESSMYWORD = {
    init: function() {
      this.groupAdded();
      this.groupJoined();
    },
    renderProfiles: function(users) {
      let profileString = '';
      for (let [_key, user] of Object.entries(users)) {
        profileString += templates.profile(user);
      }
      $('.players').html(profileString);
    },
    groupAdded() {
      socket.on('group added', (data) => {
        if (data.shareLink) {
          $("#uniqueGameCode").val(data.shareLink);
        }
        $("#login, #board").addClass('d-none');
        $("#lobby").removeClass('d-none');
        this.renderProfiles(data.groups);
      });
    },
    groupJoined() {
      socket.on('group joined', (data) => {
        $("#login, #board").addClass('d-none');
        $("#lobby").removeClass('d-none');
        this.renderProfiles(data.groups);
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
