require(['jquery', 'nightSky'], function () {

    var templateSource = $('#calculationTemplate').html();
    var calculationTemplate = Handlebars.compile(templateSource);

    function renderCycles(timeMoment, $container, id) {
        var threeCyclesSleep = timeMoment.subtract('minutes', 90 * 3).format('HH:mm A'),
            fourCyclesSleep = timeMoment.subtract('minutes', 90).format('HH:mm A'),
            fiveCyclesSleep = timeMoment.subtract('minutes', 90).format('HH:mm A');
        var method = ($('#' + id)) ? 'html' : 'append';

        $container[method] (calculationTemplate({
            '3cycles': threeCyclesSleep,
            '4cycles': fourCyclesSleep,
            '5cycles': fiveCyclesSleep
        })).slideDown(600);

    }

    $('#upTime').timepicker().on('hide.timepicker', function (e) {
        renderCycles(moment(e.time, "HH:mm A"), $('#upCalculationResult'), 'upResult');
    });

    $('#sleepTime').timepicker().on('hide.timepicker', function (e) {
        renderCycles(moment(e.time, "HH:mm A"), $('#sleepCalculationResult'), 'sleepResult');
    });

    $('.calculateBtn').css('margin-left', '25px');

});