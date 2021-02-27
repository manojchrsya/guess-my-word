/* eslint-disable */
$(function () {
  var socket = io();
  var user = {};
  var settings = {rounds: 1, timer: 30};
  const templates = {
    profile: function(user) {
      return `<div class="profileImage">
        <img class="img-responsive img-circle" width="100%" src="${user.profilePic}">
        <p class="text-center">${user.name}</p>
      </div>`;
    },
    player: function(userDetails) {
      var active = userDetails.id === user.id ? 'active' : '';
      return `<li class="list-group-item d-flex justify-content-between ${active} align-items-center">
        ${userDetails.name} <span class="badge badge-success badge-pill">${userDetails.score}</span>
      </li>`;
    },
    chat: function(data) {
      var ownMessage = data.userId === user.id ? 'media-chat-reverse' : '';
      return `<div class="media media-chat ${ownMessage}">
          <div class="media-body">
              <p>${data.message}</p>
          </div>
      </div>`;
    }
  };
  var GUESSMYWORD = {
    init: function() {
      this.groupAdded();
      this.groupJoined();
      this.onDisconnect();
    },
    renderProfiles: function(users) {
      let profileString = '';
      let boardPlayers = '';
      for (let [_key, userDetails] of Object.entries(users)) {
        profileString += templates.profile(userDetails);
        boardPlayers += templates.player(userDetails);
      }
      $('.players').html(profileString);
      $('ul.board-players').html(boardPlayers);
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
    },
    onDisconnect: function() {
      socket.on('disconnect', (data) => {
        // TODO: implement on disconnect event
      });
    },
  }
  $('.dropdown-menu').on('click', '.dropdown-item', function(e) {
    e.preventDefault();
    if ($(this).attr('data-value')) {
      $(this).siblings().removeClass('selected');
      $(this).addClass('selected');
      var parent = $(this).parent().attr('aria-labelledby');
      if (parent === 'timerDropDown') {
        settings.timer = +$(this).attr('data-value');
      } else if (parent === 'roundDropDown') {
        settings.rounds = +$(this).attr('data-value');
      }
      $(`#${parent}`).text($(this).text());
    }
  });
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

  $('.start-game').on('click', function(e) {
    e.preventDefault();
    console.log(settings);
    $("#login, #lobby").addClass('d-none');
    $("#board").removeClass('d-none');
    // this.renderProfiles(data.groups);
  })

  GUESSMYWORD.init();
});
