/* eslint-disable */
$(function () {
  var socket = io();
  var user = {};
  var groupId = '';
  var timer = false;
  var settings = {rounds: 1, timer: 30};
  var $chatContainer = $('#chat-content');
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
      var ownMessage = data.senderId === user.id ? 'media-chat-reverse' : '';
      return `<div class="media media-chat ${ownMessage}">
          <div class="media-body">
              <p>${data.message}</p>
          </div>
      </div>`;
    },
    puzzle: function(letter) {
      return `<a class="d-inline m-1 h3" href="#">${letter}</a>`
    }
  };
  var GUESSMYWORD = {
    init: function() {
      this.groupAdded();
      this.groupJoined();
      this.startGame();
      this.selectPlayer();
      this.onDisconnect();
      this.newMessage();
      this.setPuzzle();
    },
    startTimer() {
      let second = 0;
      let interval = setInterval(() => {
        $('.drawpad-timer').text(second);
        if (second >= settings.timer) {
          console.log('timesss up!!');
          clearInterval(interval);
        }
        second++;
      }, 1000);
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
          groupId = data.groupId;
          $("#uniqueGameCode").attr('data-groupId', data.groupId);
        }
        $('#roundDropDown, #timerDropDown, .start-game').removeClass('disabled').attr('disabled', false);
        $("#login, #board").addClass('d-none');
        $("#lobby").removeClass('d-none');
        this.renderProfiles(data.groups && data.groups.users);
      });
    },
    groupJoined() {
      socket.on('group joined', (data) => {
        if (data.userId === user.id) {
          $("#login, #board").addClass('d-none');
          $("#lobby").removeClass('d-none');
          // if game is already start then skip looby section
          if (data.groups && data.groups.settings && data.groups.settings.status === 'start') {
            this.initDrawPad(data);
          }
          // this.startTimer();
        }
        this.renderProfiles(data.groups && data.groups.users);
      });
    },
    startGame() {
      socket.on('start game', (data) => {
        this.initDrawPad(data);
        this.renderProfiles(data.groups && data.groups.users);
        socket.emit('select player', { groupId: data.groupId });
      });
    },
    selectPlayer() {
      socket.on('select player', (data) => {
        console.log('you have been selected player ', data);
        $('.puzzle-text').addClass('d-none');
        $('.puzzle-container').removeClass('d-none');
      });
    },
    newMessage: function() {
      socket.on('new message', (data) => {
        if (data.chat) {
          $chatContainer.append(templates.chat(data.chat)).hide().fadeIn();
          $('.publisher-input').val('');
          $chatContainer.scrollTop($chatContainer.height());
        }
      });
    },
    setPuzzle: function() {
      socket.on('set puzzle', (data) => {
        if (data.settings && data.settings.puzzle && data.settings.puzzle.length > 0) {
          const letters = data.settings.puzzle.split('');
          let puzzleText = '';
          letters.forEach(letter => {
            letter = letter.trim() || '&nbsp;&nbsp;&nbsp;';
            puzzleText += templates.puzzle(letter);
          });
          $('.puzzle-container').addClass('d-none');
          $('.puzzle-text').removeClass('d-none').html(puzzleText);
        }
      });
    },
    onDisconnect: function() {
      socket.on('disconnect', (data) => {
        // TODO: implement on disconnect event
      });
    },
    initDrawPad: function(data) {
      groupId = $("#uniqueGameCode").attr('data-groupId');
      if (groupId === data.groupId) {
        $("#login, #lobby").addClass('d-none');
        $("#board").removeClass('d-none');
        const drawpadInstance = $("#target").drawpad({ groupId: data.groupId });
        drawpadInstance.socketInstance(socket);
      } else {
        console.warn('groupId from socket not matched with existing groupId.');
      }
    }
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
    user.id = user.id || Math.random().toString(36).substring(2);
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
    user.id = user.id || Math.random().toString(36).substring(2);
    groupId = $("#uniqueGameCode").attr('data-groupId');
    socket.emit('join group', { ...user, groupId });
  });

  $('.start-game').on('click', function(e) {
    e.preventDefault();
    groupId = $("#uniqueGameCode").attr('data-groupId');
    if (groupId && user.id) {
      socket.emit('start game', { ...user, groupId, settings });
    }
  })

  $('.publisher-btn').on('click', function(e) {
    e.preventDefault();
    var chatMessage = $('.publisher-input').val();
    if (chatMessage && chatMessage.trim().length > 0) {
      groupId = $("#uniqueGameCode").attr('data-groupId');
      socket.emit('send message', { ...user, groupId, message: chatMessage });
    }
  })

  $('.set-puzzle-word').on('click', function(e){
    e.preventDefault();
    settings.puzzle = $('.puzzle-word').val();
    if (!settings.puzzle || (settings.puzzle && settings.puzzle.trim().length === 0)) {
      $(".instructions").removeClass('d-none').text('Please enter the word to continue!!');
      return false
    }
    settings.puzzle = settings.puzzle.toLowerCase();
    groupId = $("#uniqueGameCode").attr('data-groupId');
    $(this).attr('disabled', true);
    socket.emit('set puzzle', { ...user, groupId, settings });
  });

  $(window).on('load', function() {
    GUESSMYWORD.init();
  })
});
