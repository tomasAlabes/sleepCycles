require(['jquery', 'nightSky'], function(){

    $('#upTime').timepicker().on('update.timepicker', function(e) {
        console.log('The time is ' + e.time);
    });

    $('#sleepTime').timepicker().on('update.timepicker', function(e) {
        console.log('The time is ' + e.time);
    });

    $('.calculateBtn').css('margin-left', '25px');

});