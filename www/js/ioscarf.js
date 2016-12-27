  /* Naigation stack */

var navigation = [];
var ioScarfDb = new PouchDB('ioScarfDb');
var environment = 'mobile';

$( '#deviceready' ).ready(function() {

  /* Detect if browser */
  var app = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
  if ( !app ) {
      environment = 'desktop';
      console.log(environment);
  }

  /* Initialize application */

  /* Check if there are notifications, if yes, display the list of notifications once it's ok */
  /* ****** */
  /* Notifications list */
  /* ******* */
    initiateDB();


  /* Buttons actions binding goes here */
  var hammertime = new Hammer(document.getElementById('leaveWt'));
  hammertime.on('tap', function(ev) {
    goToPage('notificationsPage')
  });

  var backbuttons = document.getElementsByClassName('backButton');
  for (i=0; i<backbuttons.length; i++) {
    var ht = new Hammer(backbuttons[i]);
    ht.on('tap', function(ev2) {
      navigateBack();
    });
  }

  var ht2 = new Hammer(document.getElementById('newNotifButton'));
  ht2.on('tap', function(ev3) {
    storeNotif()
  });

  var ht3 = new Hammer(document.getElementById('configButton'));
  ht3.on('tap', function(ev) {
    goToPage('configurationPage')
  });

  /*  Initialize the carousel here */
  var c = new Carousel('.carousel');
  c.init();
  c.showPane(0);

  $( '#notificationsBody' ).ready(function() {

  });

});

/* ********************* */
/* NAVIGATION ACTIONS */
/* ********************* */

function goToPage (pageId) {

  /* Push to navigator */
  var now = new Date();
  var from = $('.activePage').attr('id');
  var navigationEvent = {'time':now.toString(), 'from': from, 'to': pageId };
  navigation.push(navigationEvent);
  logNavigation();

  /* Pages transition */
  $('.appPage.activePage').toggleClass('activePage');
  $('#'+pageId).toggleClass('activePage');
}

function navigateBack() {

  /* Push to navigator */
  var now = new Date();
  var from = $('.activePage').attr('id');
  var to = navigation[navigation.length - 1].from;
  var navigationEvent = {'time':now.toISOString(), 'from': from, 'to': to };
  navigation.push(navigationEvent);
  logNavigation();

  /* Pages transition */
  $('.appPage.activePage').toggleClass('activePage');
  $('#'+to).toggleClass('activePage');
}

function trackNavigation (target) {
  /* Push to navigator */
  var now = new Date();
  var from = $('.activePage').attr('id');
  var navigationEvent = {'time':now.toString(), 'from': from, 'to': target };
  navigation.push(navigationEvent);
  logNavigation();
}

function logNavigation () {
  console.log('At ' + navigation[navigation.length - 1].time + ', Navigation from ' + navigation[navigation.length - 1].from + ' to ' + navigation[navigation.length - 1].to);
}



/* ***************** */
/* DATABASE ACTIONS  */
/* ***************** */

function initiateDB() {

  ioScarfDb.allDocs({include_docs: true, descending: true}, function(err, doc) {
    var dataSet = doc.rows.slice();
    console.log('Found ' + dataSet.length + ' records');
    var nbNotifs =  dataSet.length;

    if (nbNotifs == 0) {
      $('#notifEmptyState').show();
    }
    else {
      buildList();
    }

  });
}

function getUniqueId() {
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
});
  return uuid;
}

function storeNotif() {

  var notifId = getUniqueId();
  console.log('### Adding element ###');
  console.log(notifId);
  var notif = {
    '_id': notifId,
    'description': 'text',
    'contacts': [],
    'type': 'phoneCall',
    'color': 'text',
    'active': true
  };
  ioScarfDb.put(notif, function callback(err, result) {
  if (!err) {
    console.log('Notification configuration stored')
    var myNotif = "<div class='notif' id='Notif_"+notif._id+"'> \
      <div class='notif_id'>"+notif._id+"</div> \
      <div class='notif_type'></div> \
      <div class='notif_contacts'>"+notif.contacts+"</div> \
      <div class='notif_description'>"+notif.description+"</div> \
      <div class='notifButton button deleteButton' id='"+notif._id+"'>DEL</div> \
      <div class='additionalActions'> \
        <div class='notifButton button closeButton'>Close</div> \
      </div> \
    </div>"

    addNotifToList (myNotif, notif._id);
  }
  else {
    console.log('oops' + err)
    console.log('### Adding element Error ###');
  }
});
}

function addNotifToList (html, id) {
  var $object = $(html).appendTo($('#notificationsList'));
  console.log($object);

  /* Here we assign the action to open full Page the notifications */
  //var notifObject = newNotif;
  ht2 = propagating(new Hammer($object.get(0)));
  ht2.on('tap', function(ev2) {
      ev2.stopPropagation();
    openFullPage($object);
  });

  /* Here we assign the actions to the buttons */
    var myId = id;
    ht = propagating(new Hammer($object.children('.deleteButton').get(0)));
    ht.domEvents=true; // enable dom events
    ht.on('tap', function(ev) {
      showActions($object, myId);
      ev.stopPropagation();
    });

    /* Here we assign the actions to the close button */
      ht3 = propagating(new Hammer($object.children('.additionalActions').children('.closeButton').get(0)));
      ht3.domEvents=true; // enable dom events
      ht3.on('tap', function(ev3) {
        closeFullPage($object);
        ev3.stopPropagation();
      });

    setScene();
    console.log('### Adding element Done ###');

}

function openFullPage(jqueryObject) {
  var notificationCard = jqueryObject;
  trackNavigation('detailView');
  notificationCard.addClass('full');
}

function closeFullPage(jqueryObject) {
  var notificationCard = jqueryObject;
  trackNavigation('notificationsPage');
  notificationCard.removeClass('full');
}


function  setScene() {

  ioScarfDb.allDocs({include_docs: true, descending: true}, function(err, doc) {
    var dataSet = doc.rows.slice();
    console.log('Found ' + dataSet.length + ' records');
    var nbNotifs =  dataSet.length;

    if (nbNotifs > 0) {
      $('#notifEmptyState').hide();
      $('#notificationsList').show();
    }
    else {
      $('#notifEmptyState').show();
      $('#notificationsList').hide();
    }

  });

}

function buildList() {

  ioScarfDb.allDocs({include_docs: true, descending: true}, function(err, doc) {
    console.log(doc);
    var dataSet = doc.rows.slice();
      var nbNotifs = dataSet.length;
      $.each (dataSet, function(i, v) {
        var notif = "<div class='notif' id='Notif_"+dataSet[i].doc._id+"'> \
          <div class='notif_id'>"+dataSet[i].doc._id+"</div> \
          <div class='notif_type'></div> \
          <div class='notif_contacts'>"+dataSet[i].doc.contacts+"</div> \
          <div class='notif_description'>"+dataSet[i].doc.description+"</div> \
          <div class='notifButton button deleteButton' id='"+dataSet[i].doc._id+"'>DEL</div> \
          <div class='additionalActions'> \
            <div class='notifButton button closeButton'>Close</div> \
          </div> \
        </div>"

        addNotifToList (notif, dataSet[i].doc._id);
  });
});
}

function showActions(notifObject, myId) {
  var actions = "<div id='actionsLayer'> \
    <table> \
      <tr> \
        <td> \
          <div class='areYouSureTitle'>Are you sure?</div> \
          <div class='button' id='deleteButton'>Yes, Delete please</div> \
          <div class='button cancelButton' id='closeDeleteConf'>Cancel</div> \
        </td> \
      </tr> \
    </table> \
  </div>"
  $('#app_root').append(actions);
  /* Buttons actions binding goes here */
  var htShowActions = propagating(new Hammer(document.getElementById('actionsLayer')));
  htShowActions.add( new Hammer.Press({ threshold: 0 }) );
  htShowActions.add( new Hammer.Pan({ direction: Hammer.DIRECTION_ALL, threshold: 0 }) );
  htShowActions.domEvents=true; // enable dom events
  htShowActions.on('tap pan press dragleft dragright swipeleft swiperight dragup dragdown swipeup swipedown', function(ev) {
  $('#actionsLayer').remove();
    ev.stopPropagation();
  });

  var htDelete = propagating(new Hammer(document.getElementById('deleteButton')));
  htDelete.domEvents=true; // enable dom events
  htDelete.on('tap', function(ev2) {
    deleteNotif(notifObject, myId);
  $('#actionsLayer').remove();
    ev2.stopPropagation();
  });

 $('#actionsLayer').show();
};

function deleteNotif(notifObject, myId) {
  ioScarfDb.get(myId).then(function (doc) {
    notifObject.remove();
    ioScarfDb.remove(doc).then(function(doc) {
        setScene();
    });
  });
}

function Carousel(selector) {
  var self = this;
  var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
  var $carousel = $(selector);
  var $container = $('.pane-container', selector);
  var $panes = $('.pane', selector);

  var paneWidth = 0;
  var paneCount = $panes.length;
  var panBoundary = .25; // if the pane is paned .25, switch to the next pane.

  var currentPane = 0;

  function setPaneSize() { // Do we need this ?
    paneWidth = $carousel.width();
    $panes.each(function(i) {
      $(this).width(paneWidth);
    });
    $container.width(paneWidth * paneCount);
  }

  self.init = function() {
    setPaneSize();
    $(window).on('load resize orientationchange', function() {
      setPaneSize();
      self.showPane(currentPane);
    })
  }

  self.showPane = function(index) {
    currentPane = Math.max(0, Math.min(index, paneCount - 1));
    setContainerOffsetX(-currentPane * paneWidth, true);
  }

  function setContainerOffsetX(offsetX, doTransition) {
  if (doTransition) {
    $container
      .addClass('transition')
      .one(transitionEnd, function() {
        $container.removeClass('transition');
      })
  }
    $container.css({
      left: offsetX
    });
  }

  self.next = function() {
    self.showPane(++currentPane);
  }
  self.prev = function() {
    self.showPane(--currentPane);
  }

  function handleHammer(e) {
    switch (e.type) {
      case 'swipeleft':
      case 'swiperight':
        handleSwipe(e);
        break;
      case 'panleft':
      case 'panright':
      case 'panend':
      case 'pancancel':
        handlePan(e);
        break;
    }
  }

  function handleSwipe(e) {
    switch (e.direction) {
      case Hammer.DIRECTION_LEFT:
        self.next();
        break;
      case Hammer.DIRECTION_RIGHT:
        self.prev();
        break;
    }
    hammer.stop(true);
  }

  function outOfBound() {
  var left = $container.position().left;
  return (currentPane == 0 && left >= 0) ||
        (currentPane == paneCount - 1 && left <= -paneWidth * (paneCount - 1));
  }

  function handlePan(e) {
    switch (e.type) {
      case 'panleft':
      case 'panright':
        // Slow down at the first and last pane.
        if (outOfBound()) {
          e.deltaX *= .2;
        }
        setContainerOffsetX(-currentPane * paneWidth + e.deltaX);
        console.log(-currentPane * paneWidth + e.deltaX);
        break;
      case 'panend':
      case 'pancancel':
        if (Math.abs(e.deltaX) > paneWidth * panBoundary) {
          if (e.deltaX > 0) {
            self.prev();
          } else {
            self.next();
          }
        } else {
          self.showPane(currentPane);
        }
        break;
    }
  }
  var hammer = new Hammer($carousel[0]).on('swipeleft swiperight panleft panright panend pancancel', handleHammer);
}
