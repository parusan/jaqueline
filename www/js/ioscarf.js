  /* Naigation stack */

var navigation = [];
var ioScarfDb = new PouchDB('ioScarfDb');
var environment = 'mobile';
var bleState = false;
var availableDevices = [];

/* Function called initially */

function deviceReady () {

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
    setBleList();

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

}

/* Function called when the application is back from background */

function onResume() {
    setBleList();
}

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
          <div class='"+ notif.type + "'></div> \
          <div class='notifInfos'> \
            <div class='introNotifInfos'>On <span class='"+ notif.type + "'></span> from </div> \
            <div class='notif_contacts'>"+notif.contacts+"</div> \
            <div class='notif_description'>"+notif.description+"</div> \
            <div class='notif_id'>"+notif._id+"</div> \
          </div> \
          <div class='notifActions'> \
            <div class='notifButton deleteButton' id='"+notif._id+"'></div> \
          </div> \
      <div class='additionalActions'> \
        <div class='notifButton button closeButton'>Close</div> \
      </div> \
    </div>"

    addNotifToList (myNotif, notif._id, notif.contacts);
  }
  else {
    console.log('oops' + err)
    console.log('### Adding element Error ###');
  }
});
}

function addNotifToList (html, id, contactsArray) {
  var $object = $(html).appendTo($('#notificationsList'));
  console.log($object);

  var nbContacts= contactsArray.length;
  console.log('Found ' + nbContacts + ' contacts for notification' + id);

  /* Let's build a mock if there is nothing */
  if (nbContacts == 0) {
    nbContacts = Math.floor(Math.random()*7) + 1 ;
    console.log(nbContacts);
    for (i=0; i<nbContacts; i++) {
      var url = getRandomFace();
      var avatar = "<div class='avatar'> \
                      <img src='"+ url + "'>\
                  </div>"
      $object.find('.notif_contacts').append($(avatar));
    }

  }

  /* Here we assign the action to open full Page the notifications */
  //var notifObject = newNotif;
  ht2 = propagating(new Hammer($object.get(0)));
  ht2.on('tap', function(ev2) {
      ev2.stopPropagation();
    openFullPage($object);
  });

  /* Here we assign the actions to the buttons */
    var myId = id;
    ht = propagating(new Hammer($object.children('.notifActions').children('.deleteButton').get(0)));
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
  trackNavigation('detailView');
  var notificationCard = jqueryObject.detach();
  notificationCard.addClass('full');
  $("#app_root").prepend(notificationCard);
  $('notificationsPage').removeClass('activePage');
}

function closeFullPage(jqueryObject) {
  var notificationCard = jqueryObject.detach();
  notificationCard.removeClass('full');
  $("#notificationsList").prepend(notificationCard);
  $('notificationsPage').addClass('activePage');
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
              <div class='"+ dataSet[i].doc.type + "'></div> \
              <div class='notifInfos'> \
                <div class='introNotifInfos'>On <span class='"+ dataSet[i].doc.type + "'></span> from </div> \
                <div class='notif_contacts'>"+dataSet[i].doc.contacts+"</div> \
                <div class='notif_description'>"+dataSet[i].doc.description+"</div> \
                <div class='notif_id'>"+dataSet[i].doc._id+"</div> \
              </div> \
              <div class='notifActions'> \
                <div class='notifButton deleteButton' id='"+dataSet[i].doc._id+"'></div> \
              </div> \
          <div class='additionalActions'> \
            <div class='notifButton button closeButton'>Close</div> \
          </div> \
        </div>"

        addNotifToList (notif, dataSet[i].doc._id, dataSet[i].doc.contacts);
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




/* Introduction Carousel */

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
    $('.pageIndicator').removeClass('active');
    indexNth = index + 1;
    $('.pageIndicator:nth-child('+ indexNth +')').addClass('active');
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


/* ******** Bluetooth functions **** */
/* ********************************* */

function setBleList() {
  ble.isEnabled(
    function() {
        bleIsEnabled();
    },
    function() {
        bleIsDisabled();
    }
);
}

function bleIsEnabled() {
  getDevices();
}

function bleIsDisabled() {
  if ( environment == 'mobile') {
    alert('oops, ble is switched off. Please switch on to proceed.');
  }
}

function getDevices() {
  // Emptying the list of deices
  availableDevices = [];
  // Removing all elements from list
  $('.device').remove();


  if (typeof ble !== 'undefined') {
      // the variable is defined
      console.log('Searching for devices');
      if (ble) {
        ble.scan([], 30, function(device) {
          onDiscoverDevice(device);
      }, onFailure());
      // Retrieve list + add to List of deices
      // TODO : make this asynchronuous + add a device or refresh list when additional devices found
    }
    else {
      console.log('BLE variable null')
    }
  }
  else {
    console.log("BLE is not defined, couldn't initialize BLE");
    alert("BLE is not defined, couldn't initialize BLE")
  }

}

function onDiscoverDevice(device) {
  var devAlreadyThere = false;
  for (i=0; i<availableDevices.length;i++) {
    if (device.id == availableDevices[i].deviceId) {
      devAlreadyThere = true;
      i=availableDevices.length + 100;
    }
  }
  if (devAlreadyThere == false) {

    // IF the deice is not already in the list
    // THen we add it
    var newDevice = {
      '_id': device.id,
      'deviceId': device.id,
      'type': 'phoneCall',
      'color': 'text',
      'active': true,
      'full_desc' : JSON.stringify(device)
    };
    availableDevices.push(newDevice);
    addDeviceToList(device);
  }

}

function onFailure() {
}


function addDeviceToList (device) {
  var desc = JSON.stringify(device);
  var html = "<div class='device' id='device_"+device.id+"'> \
  <div class='device_id'>" + device.id + "</div> \
  <div class='device_name'>" +   (device.name ? device.name : "UNKNOWN DEVICE") + "</div> \
  <div class='device_rssi'>" +   (device.rssi ? "Signal strength :" + device.rssi : "") + "</div> \
  <div class='device_full'>" + desc + "</div> \
    <div class='actionBar' id='deviceActionBar'> \
        <div class='button pushButtonHexa' id='"+device.id+"_HEXA'>Push Data</div> \
    </div> \
  </div>"
  var $object = $(html).appendTo($('#devicesList'));
  console.log($object);

  /* Here we assign the actions to the buttons */
    var myId = device.id;
    ht_dev = propagating(new Hammer($object.children('#deviceActionBar').children('.pushButtonHexa').get(0)));
    ht_dev.domEvents=true; // enable dom events
    ht_dev.on('tap', function(ev_dev) {
      sendData(device);
      ev_dev.stopPropagation();
    });

    console.log('### Adding device to DOM Done ###');

}

function sendData(device) {
  ble.connect(device.id, onConnect(device), onConnectFailure(device.id));
}

function generateRandomData() {
  var data = [];
  data[0]= "0x" + Math.floor(Math.random()*255).toString(16);
  data[1]= "0x" + Math.floor(Math.random()*255).toString(16);
  data[2]= "0x" + Math.floor(Math.random()*255).toString(16);
  data[3]= Math.floor(Math.random()*1000).toString();
  return data;
}

  function onConnect(device) {
    var service_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
    var charcteristic_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
    message = generateRandomData();
    alert(message);
    ble.writeWithoutResponse(device.id, service_uuid, characteristic_uuid, message.buffer, confirmWrite(message), writeError());
  }
    function confirmWrite() {
      alert("successfully sent : " + message);
    }
    function writeError() {
      alert("Couldn't send Data");
    }

  function onConnectFailure(id) {
    alert("couldn't connect to " + id);
  }

 function getRandomFace() {
   var faces = [{
  "first_name": "Pete",
  "last_name": "Wrigley",
  "image": "img/little-pete-wrigley.jpg",
  "location": "Wellsville, NY"
}, {
  "first_name": "Aeon",
  "last_name": "Flux",
  "image": "img/aeon-flux.jpg",
  "location": "Nation of Monica"
}, {
  "first_name": "Alan",
  "last_name": "Frog",
  "image": "img/alan-frog.jpg",
  "location": "Santa Clara, CA"
}, {
  "first_name": "Amanda",
  "last_name": "Bynes",
  "image": "img/amanda-bynes.jpg",
  "location": "Hollywood, CA"
}, {
  "first_name": "April",
  "last_name": "O'Neil",
  "image": "img/april-oneil.jpg",
  "location": "Brooklyn, NY"
}, {
  "first_name": "Artie",
  "last_name": "...the strongest man in the world",
  "image": "img/artie-strongman.jpg",
  "location": "Wellsville, NY"
}, {
  "first_name": "Baby",
  "last_name": "Sinclair",
  "image": "img/baby-sinclair.jpg",
  "location": "Pangaea"
}, {
  "first_name": "Big Pete",
  "last_name": "Wrigley",
  "image": "img/big-pete-wrigley.jpg",
  "location": "Wellsville, NY"
}, {
  "first_name": "Bobby",
  "last_name": "Budnick",
  "image": "img/bobby-budnick.jpg",
  "location": "Camp Anawanna, VA"
}, {
  "first_name": "Bradley",
  "last_name": "Taylor",
  "image": "img/bradley-taylor.jpg",
  "location": "Dude Ranch, AZ"
}, {
  "first_name": "Casey",
  "last_name": "Jones",
  "image": "img/casey-jones.jpg",
  "location": "Brooklyn, NY"
}, {
  "first_name": "Charlene",
  "last_name": "Sinclair",
  "image": "img/charlene-sinclair.jpg",
  "location": "Pangaea"
}, {
  "first_name": "Chris",
  "last_name": "Chambers",
  "image": "img/chris-chambers.jpg",
  "location": "Castlerock, OR"
}, {
  "first_name": "Danny",
  "last_name": "Lightfoot",
  "image": "img/danny-lightfoot.jpg",
  "location": "Dude Ranch, AZ"
}, {
  "first_name": "Danny",
  "last_name": "Pennington",
  "image": "img/danny-pennington.jpg",
  "location": "Brooklyn, NY"
}, {
  "first_name": "Daria",
  "last_name": "Morgendorffer",
  "image": "img/daria-morgendorffer.jpg",
  "location": "Lawndale, MTV"
}, {
  "first_name": "Dina",
  "last_name": "Alexander",
  "image": "img/dina-alexander.jpg",
  "location": "Camp Anawanna, VA"
}, {
  "first_name": "Eddie",
  "last_name": "Gelfen",
  "image": "img/eddie-gelfen.jpg",
  "location": "Camp Anawanna, VA"
}, {
  "first_name": "Ellen Josephine",
  "last_name": "Hickle",
  "image": "img/ellen-josephine-hickle.jpg",
  "location": "Wellsville, NY"
}, {
  "first_name": "Ernest",
  "last_name": "Worrell",
  "image": "img/ernest-worrell.jpg",
  "location": "Jail, Prison"
}]
var nbFaces = faces.length;
var which = Math.floor(Math.random()*nbFaces);
return faces[which].image;
 }
