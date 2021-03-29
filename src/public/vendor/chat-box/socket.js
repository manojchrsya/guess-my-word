/* eslint-disable */
$(window).on('load', function() {
  var socket = io({forceNew: true});
  var user = {};
  // get user detail from storage
  var __user = Storage().getItem('__user');
  if (__user) {
    try {
      __user = JSON.parse(__user);
      user.name = __user.name || '';
      user.id = __user.id || '';
    } catch (e) {
      console.warn('user detail not available.');
    }
  }
  var groupId = '';
  var settings = {rounds: 1, timer: 30, playerId: '', currentRound: 1};
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
      var chatContent = '';
      if (data.message) {
        chatContent = `<p>${data.message}</p>`;
      } else if (data.meta) {
        chatContent = `<p class="meta"><span class="badge badge-success badge-pill">${data.meta}</div></p>`;
      }
      return `<div class="media media-chat ${ownMessage}">
          <div class="media-body">${chatContent}</div>
      </div>`;
    },
    puzzle: function(letter) {
      return `<a class="d-inline m-1 h3" href="#">${letter}</a>`
    },
    round: function(data) {
      return `Round ${data.currentRound} of ${data.rounds}`;
    },
    winner: function(data, cols) {
      return `<div class="col-md-${cols}"> <div class="profileImage">
        <img class="img-responsive img-circle" width="100%" src="${data.profilePic}" alt="${data.name}">
        <p class="text-center">#${data.rank}</p> <p class="text-center">${data.name}</p>
      </div></div>`;
    }
  };
  var GUESSMYWORD = {
    init: function() {
      this.setUserName();
      this.groupAdded();
      this.groupJoined();
      this.startGame();
      this.selectPlayer();
      this.onDisconnect();
      this.newMessage();
      this.setPuzzle();
      this.finishGame();
      this.reloadData();
    },
    setUserName() {
      if (user && user.id) {
        $('.username').val(user.name);
      }
    },
    startTimer() {
      this.second = settings.timer;
      this.interval = setInterval(() => {
        $('.drawpad-timer').text(this.second);
        if (this.second <= 0) {
          // deregister mouse or touch events;
          if (this.drawpadInstance) {
            this.drawpadInstance.clear();
            this.drawpadInstance.events('off');
          }
          if (settings.playerId === user.id) {
            // select new player if timer get completes
            groupId = $("#uniqueGameCode").attr('data-groupId');
            socket.emit('show puzzle', { groupId });
            // select new player after 4 seconds
            setTimeout(() => {
              socket.emit('select player', { groupId });
            }, 4000);
          }
          console.log('timesss up!!');
          clearInterval(this.interval);
        }
        this.second--;
      }, 1000);
    },
    renderProfiles: function(users) {
      let profileString = '';
      let boardPlayers = '';
      let players = [];
      for (let [_key, userDetails] of Object.entries(users)) {
        profileString += templates.profile(userDetails);
        boardPlayers += templates.player(userDetails);
        players.push(userDetails);
      }
      $('.players').html(profileString);
      $('ul.board-players').html(boardPlayers);
      players.sort((a, b) => b.score - a.score);
      // render only top 3 player in winner screen
      this.renderWinners(players.splice(0, 3));
    },
    renderWinners: function(users) {
      let winners = '';
      let cols = 4;
      if (users.length === 1) cols = 12; else if (users.length === 2) cols = 6;
      users.forEach((user, index) => {
        user.rank = (index + 1);
        winners += templates.winner(user, cols);
      });
      $('.winners').html(winners);
    },
    renderRound: function(data) {
      let roundString = templates.round(data);
      $('.rounds').html(roundString);
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
        console.log('--- game started',data);
        $("#winnerModal").modal('hide');
        // update settings from admin user
        if (data.groups && data.groups.settings) {
          Object.assign(settings, data.groups.settings);
          // update round info in screen
          this.renderRound(data.groups.settings);
        }
        this.initDrawPad(data);
        this.renderProfiles(data.groups && data.groups.users);
        setTimeout(() => {
          $("#login, #lobby").addClass('d-none');
          $("#board").removeClass('d-none');
        }, 500)
        if (data.userId === user.id) {
          // set admin player role
          user.role = 'admin';
          socket.emit('select player', { groupId: data.groupId });
        }
      });
    },
    finishGame() {
      socket.on('finish game', (data) => {
        // update settings from admin user
        if (data.groups && data.groups.settings) {
          Object.assign(settings, data.groups.settings);
          // update round info in screen
          this.renderRound(data.groups.settings);
        }
        this.renderProfiles(data.groups && data.groups.users);
        $('#winnerModal').modal('show');
      });
    },
    selectPlayer() {
      socket.on('select player', (data) => {
        // update playerId in setting in client side
        settings.playerId = data.player && data.player.id;
        // update round info in screen
        if (data.groups && data.groups.settings) {
          this.renderRound(data.groups.settings);
        }
        if (user.id === data.player.id) {
          console.log('you have been selected player ', data);
          $('.puzzle-word').val('');
          $('.set-puzzle-word').attr('disabled', false);
          $('.puzzle-text').addClass('d-none');
          $('.puzzle-container').removeClass('d-none');
          // register mouse or touch events;
          if (this.drawpadInstance) {
            this.drawpadInstance.clear();
            this.drawpadInstance.events('on');
          }
        }
      });
    },
    newMessage: function() {
      socket.on('new message', (data) => {
        if (data.chat) {
          $chatContainer.append(templates.chat(data.chat));
          $('.publisher-input').val('');
          $chatContainer.scrollTop($chatContainer.height());
        }
      });
    },
    setPuzzle: function() {
      socket.on('set puzzle', (data) => {
        // update settings from admin user
        if (data.settings && data.settings) {
          Object.assign(settings, data.settings);
        }
        if (data.settings && data.settings.puzzle && data.settings.puzzle.length > 0) {
          const letters = data.settings.puzzle.split('');
          let puzzleText = '';
          letters.forEach(letter => {
            letter = letter.trim() || '&nbsp;&nbsp;';
            puzzleText += templates.puzzle(letter);
          });
          $('.puzzle-container').addClass('d-none');
          $('.puzzle-text').removeClass('d-none').html(puzzleText);
          this.startTimer();
        }
      });
    },
    onDisconnect: function() {
      socket.on('disconnect', (data) => {
        // TODO: implement reconnect feature
        // socket.disconnect();
        console.log('reconnecting user to group...');
        groupId = $("#uniqueGameCode").attr('data-groupId');
        if (groupId && user && user.id) {
          socket.emit('join group', { ...user, groupId });
        }
        $("#winnerModal").modal('hide');
      });
    },
    initDrawPad: function(data) {
      groupId = $("#uniqueGameCode").attr('data-groupId');
      if (groupId === data.groupId) {
        $("#login, #lobby").addClass('d-none');
        $("#board").removeClass('d-none');
        this.drawpadInstance = $("#target").drawpad({ groupId: data.groupId });
        this.drawpadInstance.socketInstance(socket);
      } else {
        console.warn('groupId from socket not matched with existing groupId.');
      }
    },
    reloadData: function() {
      socket.on('relaod data', (data) => {
        // update settings from admin user
        if (data.groups && data.groups.settings) {
          Object.assign(settings, data.groups.settings);
          // update round info in screen
          this.renderRound(data.groups.settings);
        }
        this.renderProfiles(data.groups && data.groups.users);
        if (data.finish && this.interval) {
          // set timer value to 0 so that current round can finish
          this.second = 0;
          $('.drawpad-timer').text('0');
          // clear drawpad and register mouse or touch events;
          if (this.drawpadInstance) {
            this.drawpadInstance.clear();
            this.drawpadInstance.events('off');
          }
        }
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
    // set user info in localstorage
    Storage().setItem('__user', JSON.stringify(user));
    socket.emit('join group', { ...user, groupId });
  });

  $('.start-game').on('click', function(e) {
    e.preventDefault();
    groupId = $("#uniqueGameCode").attr('data-groupId');
    if (groupId && user.id) {
      // set user info in localstorage
      Storage().setItem('__user', JSON.stringify(user));
      socket.emit('start game', { ...user, groupId, settings });
    }
  })
  $(".publisher-input").on('keypress', function (e) {
    if (e.which === 13) {
      e.preventDefault();
      $('.publisher-btn').trigger('click');
    }
  });
  $('.publisher-btn').on('click', function(e) {
    e.preventDefault();
    var chatMessage = $('.publisher-input').val();
    if (chatMessage && chatMessage.trim().length > 0) {
      groupId = $("#uniqueGameCode").attr('data-groupId');
      var speed = parseInt(settings.timer - parseInt($('.drawpad-timer').text()));
      socket.emit('send message', { ...user, groupId, message: chatMessage, speed });
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

  $('#winnerModal').on('hidden.bs.modal', function (e) {
    $("#login, #board").addClass('d-none');
    $("#lobby").removeClass('d-none');
  })

  function Storage(storageType) {
    var storage = {
      type: storageType || "localStorage",
      setItem: (key, value) => {
        try {
          window[storage.type].setItem(key, value);
        } catch (err) {
          console.warn(err.message);
        }
      },
      getItem: (key) => {
        if (window[storage.type].getItem(key)) {
          return window[storage.type].getItem(key);
        }
        return false;
      },
      removeItem: (key) => {
        if (window[storage.type].getItem(key) || window[storage.type].getItem(key) == null) {
          return window[storage.type].removeItem(key);
        }
        return false;
      }
    };
    return storage;
  }
  // initialise guess my word
  GUESSMYWORD.init();
});
