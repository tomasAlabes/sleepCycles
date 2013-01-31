/*!
 * Timepicker Component for Twitter Bootstrap
 *
 * Copyright 2013 Joris de Wit
 *
 * Contributors https://github.com/jdewit/bootstrap-timepicker/graphs/contributors
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
;(function($, window, document, undefined) {

  'use strict'; // jshint ;_;

  // TIMEPICKER PUBLIC CLASS DEFINITION
  var Timepicker = function(element, options) {
    this.widget = '';
    this.$element = $(element);
    this.defaultTime = options.defaultTime;
    this.disableFocus = options.disableFocus;
    this.isOpen = options.isOpen;
    this.minuteStep = options.minuteStep;
    this.modalBackdrop = options.modalBackdrop;
    this.secondStep = options.secondStep;
    this.showInputs = options.showInputs;
    this.showMeridian = options.showMeridian;
    this.showSeconds = options.showSeconds;
    this.template = options.template;

    this._init();
  };

  Timepicker.prototype = {

    constructor: Timepicker,

    _init: function() {
      var self = this;

      if (this.$element.parent().hasClass('input-append')) {
          this.$element.parent('.input-append').find('.add-on').on({
            'click.timepicker': $.proxy(this.showWidget, this)
          });
          this.$element.on({
            'focus.timepicker': $.proxy(this.highlightUnit, this),
            'click.timepicker': $.proxy(this.highlightUnit, this),
            'keypress.timepicker': $.proxy(this.elementKeypress, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
      } else {
        if (this.template) {
          this.$element.on({
            'focus.timepicker': $.proxy(this.showWidget, this),
            'click.timepicker': $.proxy(this.showWidget, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
        } else {
          this.$element.on({
            'focus.timepicker': $.proxy(this.highlightUnit, this),
            'click.timepicker': $.proxy(this.highlightUnit, this),
            'keypress.timepicker': $.proxy(this.elementKeypress, this),
            'blur.timepicker': $.proxy(this.blurElement, this)
          });
        }
      }

      this.$widget = $(this.getTemplate()).appendTo(this.$element.parents('.bootstrap-timepicker')).on('click', $.proxy(this.widgetClick, this));

      if (this.showInputs) {
          this.$widget.find('input').each(function() {
            $(this).on({
              'click.timepicker': function() { $(this).select(); },
              'keypress.timepicker': $.proxy(self.widgetKeypress, self),
              'change.timepicker': $.proxy(self.updateFromWidgetInputs, self)
            });
          });
      }

      this.setDefaultTime(this.defaultTime);
    },

    blurElement: function() {
      this.highlightedUnit = undefined;
      this.updateFromElementVal();
    },

    decrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 1) {
          return this.hour = 12;
        }
        else if (this.hour === 12) {
          this.toggleMeridian();
        }
      }
      if (this.hour === 0) {
        return this.hour = 23;
      }
      this.hour = this.hour - 1;
    },

    decrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute - step;
      } else {
        newVal = this.minute - this.minuteStep;
      }

      if (newVal < 0) {
        this.decrementHour();
        this.minute = newVal + 60;
      } else {
        this.minute = newVal;
      }
    },

    decrementSecond: function() {
      var newVal = this.second - this.secondStep;
      if (newVal < 0) {
        this.decrementMinute(true);
        this.second = newVal + 60;
      } else {
        this.second = newVal;
      }
    },

    elementKeypress: function(e) {
      switch (e.keyCode) {
        case 0: //input
        break;
        case 9: //tab
          this.updateFromElementVal();
          if (this.showMeridian) {
            if (this.highlightedUnit !== 'meridian') {
              e.preventDefault();
              this.highlightNextUnit();
            }
          } else {
            if (this.showSeconds) {
              if (this.highlightedUnit !== 'second') {
                e.preventDefault();
                this.highlightNextUnit();
              }
            } else {
              if (this.highlightedUnit !== 'minute') {
                e.preventDefault();
                this.highlightNextUnit();
              }
            }
          }
        break;
        case 27: // escape
          this.updateFromElementVal();
        break;
        case 37: // left arrow
          this.updateFromElementVal();
          this.highlightPrevUnit();
        break;
        case 38: // up arrow
          switch (this.highlightedUnit) {
            case 'hour':
              this.incrementHour();
            break;
            case 'minute':
              this.incrementMinute();
            break;
            case 'second':
              this.incrementSecond();
            break;
            case 'meridian':
              this.toggleMeridian();
            break;
          }
          this.updateElement();
        break;
        case 39: // right arrow
          this.updateFromElementVal();
          this.highlightNextUnit();
        break;
        case 40: // down arrow
          switch (this.highlightedUnit) {
            case 'hour':
              this.decrementHour();
            break;
            case 'minute':
              this.decrementMinute();
            break;
            case 'second':
              this.decrementSecond();
            break;
            case 'meridian':
              this.toggleMeridian();
            break;
          }
          this.updateElement();
        break;
      }

      if (e.keyCode !== 0 && e.keyCode !== 8 && e.keyCode !== 9 && e.keyCode !== 46) {
        e.preventDefault();
      }
    },

    formatTime: function(hour, minute, second, meridian) {
      hour = hour < 10 ? '0' + hour : hour;
      minute = minute < 10 ? '0' + minute : minute;
      second = second < 10 ? '0' + second : second;

      return hour + ':' + minute + (this.showSeconds ? ':' + second : '') + (this.showMeridian ? ' ' + meridian : '');
    },

    getCursorPosition: function() {
      var input = this.$element.get(0);

      if ('selectionStart' in input) {// Standard-compliant browsers

        return input.selectionStart;
      } else if (document.selection) {// IE fix
        input.focus();
        var sel = document.selection.createRange(),
          selLen = document.selection.createRange().text.length;

        sel.moveStart('character', - input.value.length);

        return sel.text.length - selLen;
      }
    },

    getTemplate: function() {
      var template,
        hourTemplate,
        minuteTemplate,
        secondTemplate,
        meridianTemplate,
        templateContent;

      if (this.showInputs) {
        hourTemplate = '<input type="text" name="hour" class="bootstrap-timepicker-hour" maxlength="2"/>';
        minuteTemplate = '<input type="text" name="minute" class="bootstrap-timepicker-minute" maxlength="2"/>';
        secondTemplate = '<input type="text" name="second" class="bootstrap-timepicker-second" maxlength="2"/>';
        meridianTemplate = '<input type="text" name="meridian" class="bootstrap-timepicker-meridian" maxlength="2"/>';
      } else {
        hourTemplate = '<span class="bootstrap-timepicker-hour"></span>';
        minuteTemplate = '<span class="bootstrap-timepicker-minute"></span>';
        secondTemplate = '<span class="bootstrap-timepicker-second"></span>';
        meridianTemplate = '<span class="bootstrap-timepicker-meridian"></span>';
      }

      templateContent = '<table class="'+ (this.showSeconds ? 'show-seconds' : '') +' '+ (this.showMeridian ? 'show-meridian' : '') +'">'+
         '<tr>'+
           '<td><a href="#" data-action="incrementHour"><i class="icon-chevron-up"></i></a></td>'+
           '<td class="separator">&nbsp;</td>'+
           '<td><a href="#" data-action="incrementMinute"><i class="icon-chevron-up"></i></a></td>'+
           (this.showSeconds ?
             '<td class="separator">&nbsp;</td>'+
             '<td><a href="#" data-action="incrementSecond"><i class="icon-chevron-up"></i></a></td>'
           : '') +
           (this.showMeridian ?
             '<td class="separator">&nbsp;</td>'+
             '<td class="meridian-column"><a href="#" data-action="toggleMeridian"><i class="icon-chevron-up"></i></a></td>'
           : '') +
         '</tr>'+
         '<tr>'+
           '<td>'+ hourTemplate +'</td> '+
           '<td class="separator">:</td>'+
           '<td>'+ minuteTemplate +'</td> '+
           (this.showSeconds ?
            '<td class="separator">:</td>'+
            '<td>'+ secondTemplate +'</td>'
           : '') +
           (this.showMeridian ?
            '<td class="separator">&nbsp;</td>'+
            '<td>'+ meridianTemplate +'</td>'
           : '') +
         '</tr>'+
         '<tr>'+
           '<td><a href="#" data-action="decrementHour"><i class="icon-chevron-down"></i></a></td>'+
           '<td class="separator"></td>'+
           '<td><a href="#" data-action="decrementMinute"><i class="icon-chevron-down"></i></a></td>'+
           (this.showSeconds ?
            '<td class="separator">&nbsp;</td>'+
            '<td><a href="#" data-action="decrementSecond"><i class="icon-chevron-down"></i></a></td>'
           : '') +
           (this.showMeridian ?
            '<td class="separator">&nbsp;</td>'+
            '<td><a href="#" data-action="toggleMeridian"><i class="icon-chevron-down"></i></a></td>'
           : '') +
         '</tr>'+
       '</table>';

      switch(this.template) {
        case 'modal':
          template = '<div class="bootstrap-timepicker-widget modal hide fade in" data-backdrop="'+ (this.modalBackdrop ? 'true' : 'false') +'">'+
            '<div class="modal-header">'+
              '<a href="#" class="close" data-dismiss="modal">×</a>'+
              '<h3>Pick a Time</h3>'+
            '</div>'+
            '<div class="modal-content">'+
              templateContent +
            '</div>'+
            '<div class="modal-footer">'+
              '<a href="#" class="btn btn-primary" data-dismiss="modal">Ok</a>'+
            '</div>'+
          '</div>';
        break;
        case 'dropdown':
          template = '<div class="bootstrap-timepicker-widget dropdown-menu">'+ templateContent +'</div>';
        break;
      }

      return template;
    },

    getTime: function() {
      return this.formatTime(this.hour, this.minute, this.second, this.meridian);
    },

    hideWidget: function() {
      if (this.isOpen === false) {
        return;
      }

      this.$element.trigger({
        'type': 'hide.timepicker',
        'time': this.getTime(),
        'info': {
            'hours': this.hour,
            'minutes': this.minute,
            'seconds': this.second,
            'meridian': this.meridian
        }
      });

      if (this.template === 'modal') {
        this.$widget.modal('hide');
      } else {
        this.$widget.removeClass('open');
      }

      $(document).off('mousedown.timepicker');

      this.isOpen = false;
    },

    highlightUnit: function() {
      this.position = this.getCursorPosition();
      if (this.position >= 0 && this.position <= 2) {
        this.highlightHour();
      } else if (this.position >= 3 && this.position <= 5) {
        this.highlightMinute();
      } else if (this.position >= 6 && this.position <= 8) {
        if (this.showSeconds) {
          this.highlightSecond();
        } else {
          this.highlightMeridian();
        }
      } else if (this.position >= 9 && this.position <= 11) {
        this.highlightMeridian();
      }
    },

    highlightNextUnit: function() {
      switch (this.highlightedUnit) {
        case 'hour':
          this.highlightMinute();
        break;
        case 'minute':
          if (this.showSeconds) {
            this.highlightSecond();
          } else {
            this.highlightMeridian();
          }
        break;
        case 'second':
          this.highlightMeridian();
        break;
        case 'meridian':
          this.highlightHour();
        break;
      }
    },

    highlightPrevUnit: function() {
      switch (this.highlightedUnit) {
        case 'hour':
          this.highlightMeridian();
        break;
        case 'minute':
          this.highlightHour();
        break;
        case 'second':
          this.highlightMinute();
        break;
        case 'meridian':
          if (this.showSeconds) {
            this.highlightSecond();
          } else {
            this.highlightMinute();
          }
        break;
      }
    },

    highlightHour: function() {
      this.highlightedUnit = 'hour';
      this.$element.get(0).setSelectionRange(0,2);
    },

    highlightMinute: function() {
      this.highlightedUnit = 'minute';
      this.$element.get(0).setSelectionRange(3,5);
    },

    highlightSecond: function() {
      this.highlightedUnit = 'second';
      this.$element.get(0).setSelectionRange(6,8);
    },

    highlightMeridian: function() {
      this.highlightedUnit = 'meridian';
      if (this.showSeconds) {
        this.$element.get(0).setSelectionRange(9,11);
      } else {
        this.$element.get(0).setSelectionRange(6,8);
      }
    },

    incrementHour: function() {
      if (this.showMeridian) {
        if (this.hour === 11) {
          this.toggleMeridian();
        } else if (this.hour === 12) {
          return this.hour = 1;
        }
      }
      if (this.hour === 23) {
        return this.hour = 0;
      }
      this.hour = this.hour + 1;
    },

    incrementMinute: function(step) {
      var newVal;

      if (step) {
        newVal = this.minute + step;
      } else {
        newVal = this.minute + this.minuteStep - (this.minute % this.minuteStep);
      }

      if (newVal > 59) {
        this.incrementHour();
        this.minute = newVal - 60;
      } else {
        this.minute = newVal;
      }
    },

    incrementSecond: function() {
      var newVal = this.second + this.secondStep - (this.second % this.secondStep);
      if (newVal > 59) {
        this.incrementMinute(true);
        this.second = newVal - 60;
      } else {
        this.second = newVal;
      }
    },

    remove: function() {
      $('document').off('.timepicker');
      this.$widget.remove();
      delete this.$element.data().timepicker;
    },

    setDefaultTime: function(defaultTime){
      if (this.$element.val() === '') {
        if (defaultTime === 'current') {
          var dTime = new Date(),
            hours = dTime.getHours(),
            minutes = Math.floor(dTime.getMinutes() / this.minuteStep) * this.minuteStep,
            seconds = Math.floor(dTime.getSeconds() / this.secondStep) * this.secondStep,
            meridian = 'AM';

          if (this.showMeridian) {
            if (hours === 0) {
              hours = 12;
            } else if (hours >= 12) {
              if (hours > 12) {
                hours = hours - 12;
              }
              meridian = 'PM';
            } else {
               meridian = 'AM';
            }
          }

          this.hour = hours;
          this.minute = minutes;
          this.second = seconds;
          this.meridian = meridian;

          this.update();
        }
      } else {
        this.updateFromElementVal();
      }
    },

    setTime: function(time) {
      this.setValues(time);
      this.update();
    },

    setValues: function(time) {
      var arr,
        timeArray;

      if (this.showMeridian) {
        arr = time.split(' ');
        timeArray = arr[0].split(':');
        this.meridian = arr[1];
      } else {
        timeArray = time.split(':');
      }

      this.hour = parseInt(timeArray[0], 10);
      this.minute = parseInt(timeArray[1], 10);
      this.second = parseInt(timeArray[2], 10);

      if (isNaN(this.hour)) {
        this.hour = 0;
      }
      if (isNaN(this.minute)) {
        this.minute = 0;
      }

      if (this.showMeridian) {
        if (this.hour > 12) {
          this.hour = 12;
        } else if (this.hour < 1) {
          this.hour = 12;
        }

        if (this.meridian === 'am' || this.meridian === 'a') {
          this.meridian = 'AM';
        } else if (this.meridian === 'pm' || this.meridian === 'p') {
          this.meridian = 'PM';
        }

        if (this.meridian !== 'AM' && this.meridian !== 'PM') {
          this.meridian = 'AM';
        }
      } else {
         if (this.hour >= 24) {
          this.hour = 23;
        } else if (this.hour < 0) {
          this.hour = 0;
        }
      }

      if (this.minute < 0) {
        this.minute = 0;
      } else if (this.minute >= 60) {
        this.minute = 59;
      }

      if (this.showSeconds) {
        if (isNaN(this.second)) {
          this.second = 0;
        } else if (this.second < 0) {
          this.second = 0;
        } else if (this.second >= 60) {
          this.second = 59;
        }
      }

      this.update();
    },

    showWidget: function() {
      if (this.isOpen) {
        return;
      }

      var self = this;
      $(document).on('mousedown.timepicker', function (e) {
        // Clicked outside the timepicker, hide it
        if ($(e.target).closest('.bootstrap-timepicker-widget').length === 0) {
          self.hideWidget();
        }
      });

      this.$element.trigger({
        'type': 'show.timepicker',
        'time': this.getTime(),
        'info': {
          'hours': this.hour,
          'minutes': this.minute,
          'seconds': this.second,
          'meridian': this.meridian
        }
      });

      if (this.disableFocus) {
        this.$element.blur();
      }

      this.updateFromElementVal();

      if (this.template === 'modal') {
        this.$widget.modal('show').on('hidden', $.proxy(this.hideWidget, this));
      } else {
        if (this.isOpen === false) {
          this.$widget.addClass('open');
        }
      }

      this.isOpen = true;
    },

    toggleMeridian: function() {
      this.meridian = this.meridian === 'AM' ? 'PM' : 'AM';

      this.update();
    },

    widgetClick: function(e) {
      e.stopPropagation();
      e.preventDefault();

      var action = $(e.target).closest('a').data('action');
      if (action) {
        this[action]();
        this.update();
      }
    },

    widgetKeypress: function(e) {
      var input = $(e.target).closest('input').attr('name');

      switch (e.keyCode) {
        case 9: //tab
          this.updateFromWidgetInputs();

          if (this.showMeridian) {
            if (input === 'meridian') {
              this.hideWidget();
            }
          } else {
            if (this.showSeconds) {
              if (input === 'second') {
                this.hideWidget();
              }
            } else {
              if (input === 'minute') {
                this.hideWidget();
              }
            }
          }
        break;
        case 27: // escape
          this.hideWidget();
        break;
        case 38: // up arrow
          switch (input) {
            case 'hour':
              this.incrementHour();
            break;
            case 'minute':
              this.incrementMinute();
            break;
            case 'second':
              this.incrementSecond();
            break;
            case 'meridian':
              this.toggleMeridian();
            break;
          }
          this.update();
        break;
        case 40: // down arrow
          switch (input) {
            case 'hour':
              this.decrementHour();
            break;
            case 'minute':
              this.decrementMinute();
            break;
            case 'second':
              this.decrementSecond();
            break;
            case 'meridian':
              this.toggleMeridian();
            break;
          }
          this.update();
        break;
      }
    },

    update: function() {
      this.updateElement();
      this.updateWidget();
    },

    updateElement: function() {
      var time = this.getTime();

      this.$element.val(time).change();

      switch (this.highlightedUnit) {
        case 'hour':
          this.highlightHour();
        break;
        case 'minute':
          this.highlightMinute();
        break;
        case 'second':
          this.highlightSecond();
        break;
        case 'meridian':
          this.highlightMeridian();
        break;
      }
    },

    updateFromElementVal: function() {
      var time = this.$element.val();
      if (time) {
        this.setValues(time);
        this.updateWidget();
      }
    },

    updateWidget: function() {
      if (this.showInputs) {
        this.$widget.find('input.bootstrap-timepicker-hour').val(this.hour < 10 ? '0' + this.hour : this.hour);
        this.$widget.find('input.bootstrap-timepicker-minute').val(this.minute < 10 ? '0' + this.minute : this.minute);
        if (this.showSeconds) {
          this.$widget.find('input.bootstrap-timepicker-second').val(this.second < 10 ? '0' + this.second : this.second);
        }
        if (this.showMeridian) {
          this.$widget.find('input.bootstrap-timepicker-meridian').val(this.meridian);
        }
      } else {
        this.$widget.find('span.bootstrap-timepicker-hour').text(this.hour);
        this.$widget.find('span.bootstrap-timepicker-minute').text(this.minute < 10 ? '0' + this.minute : this.minute);
        if (this.showSeconds) {
          this.$widget.find('span.bootstrap-timepicker-second').text(this.second < 10 ? '0' + this.second : this.second);
        }
        if (this.showMeridian) {
          this.$widget.find('span.bootstrap-timepicker-meridian').text(this.meridian);
        }
      }
    },

    updateFromWidgetInputs: function() {
      var time = $('input.bootstrap-timepicker-hour', this.$widget).val() + ':' +
             $('input.bootstrap-timepicker-minute', this.$widget).val() +
             (this.showSeconds ? ':' + $('input.bootstrap-timepicker-second', this.$widget).val() : '') +
             (this.showMeridian ? ' ' + $('input.bootstrap-timepicker-meridian', this.$widget).val() : '');
      this.setValues(time);
    }
  };


  //TIMEPICKER PLUGIN DEFINITION
  $.fn.timepicker = function(option) {
    var args = Array.apply(null, arguments);
    args.shift();
    return this.each(function() {
      var $this = $(this),
        data = $this.data('timepicker'),
        options = typeof option === 'object' && option;

      if (!data) {
        $this.data('timepicker', (data = new Timepicker(this, $.extend({}, $.fn.timepicker.defaults, options))));
      }

      if (typeof option === 'string') {
        data[option].apply(data, args);
      }
    });
  };

  $.fn.timepicker.defaults = {
    defaultTime: 'current',
    disableFocus: false,
    isOpen: false,
    minuteStep: 15,
    modalBackdrop: false,
    secondStep: 15,
    showSeconds: false,
    showInputs: true,
    showMeridian: true,
    template: 'dropdown'
  };

  $.fn.timepicker.Constructor = Timepicker;

})(jQuery, window, document);
