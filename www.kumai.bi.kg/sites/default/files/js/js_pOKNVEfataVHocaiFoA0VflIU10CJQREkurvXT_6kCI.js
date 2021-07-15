/**
 * @file
 * Initialize object extended to jQuery for global operations.
 */

(function($) {
  Drupal.behaviors.yamapsInit = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        $.extend({
          yaMaps: {
            // Maps on page.
            maps: {},
            // Map tools.
            _mapTools: [],
            // Layouts.
            _layouts: {},
            addMapTools: function(button) {
              this._mapTools.push(button);
            },
            getMapTools: function(Map) {
              var tools = [];
              for (var i in this._mapTools) {
                if (typeof this._mapTools[i] == 'function') {
                  tools.push(this._mapTools[i](Map));
                }
                else {
                  tools.push(this._mapTools[i]);
                }
              }
              return tools;
            },
            addLayout: function(name, layout) {
              this._layouts[name] = layout;
            },
            initLayouts: function() {
              for (var name in this._layouts) {
                ymaps.layout.storage.add(name, this._layouts[name]);
              }
            }
          }
        });

        $.yaMaps.BaseYamapsObject = {
          // Edit mode for line and polygon.
          startEditing: function(active) {
            this.element.editor.startEditing();
            if (active) {
              this.element.editor.state.set('drawing', true);
            }
            this.element.editor.events.add('statechange', function(e) {
              if (this.element.editor.state.get('editing') && !this.element.editor.state.get('drawing')) {
                this.openBalloon();
              }
            }, this);
          },
          // Set line and polygon colors.
          setColor: function(strokeColor, fillColor) {
            this.element.options.set('strokeColor', $.yaMaps.colors[strokeColor]);
            if (typeof fillColor != 'undefined') {
              this.element.options.set('fillColor', $.yaMaps.colors[fillColor]);
            }
          },
          // Set balloon content.
          setContent: function(balloonContent) {
            this.element.properties.set('balloonContent', balloonContent);
          },
          // Set opacity.
          setOpacity: function(opacity) {
            this.element.options.set('opacity', opacity);
          },
          // Set line width.
          setWidth: function(width) {
            this.element.options.set('strokeWidth', width);
          },
          // Open balloon.
          openBalloon: function() {
            this.element.balloon.open();
          },
          // Close balloon.
          closeBalloon: function() {
            this.element.balloon.close();
          },
          // Remove line or polygon.
          remove: function() {
            this.getParent().remove(this);
            this.exportParent();
          },
          // Set parent object.
          setParent: function(Parent) {
            this.parent = Parent;
          },
          // Get parent.
          getParent: function() {
            return this.parent;
          },
          // Export line or polygon.
          Export: function() {
            var coords = this.element.geometry.getCoordinates();
            if (typeof coords[0] != 'object' || coords.length < 1) {
              return;
            }
            else {
              if (typeof coords[0][0] == 'object') {
                if (coords[0].length < 3) {
                  return;
                }
              }
              else if (coords.length < 2) {
                return;
              }
            }
            var props = this.element.properties.getAll();
            var data = {
              coords: coords,
              params: {
                strokeWidth: props.strokeWidth,
                strokeColor: props.strokeColor,
                balloonContent: props.balloonContent,
                opacity: props.opacity
              }
            };
            if (typeof props.fillColor != 'undefined') {
              data.params.fillColor = props.fillColor;
            }
            return data;
          },
          // Export all lines or polygons on this map to html container.
          exportParent: function() {
            var collection = this.getParent();
            if (collection) {
              collection.exportToHTML();
            }
          },
          // Init object.
          _init: function(element) {
            this.element = element;
            this.parent = null;

            // Actions for export lines or polygons.
            this.element.events.add(['geometrychange', 'propertieschange'], this.exportParent, this);

            // Line or polygon initialization parameters.
            this.element.properties.set('element', this);
            var properties = this.element.properties.getAll();
            this.setColor(properties.strokeColor, properties.fillColor);
            this.setOpacity(properties.opacity);
            this.setWidth(properties.strokeWidth);
          }
        };

        $.yaMaps.BaseYamapsObjectCollection = {
          // Export collection.
          Export: function() {
            var data = [];
            this.elements.each(function(element) {
              var content = element.properties.get('element').Export();
              if (content) {
                data.push(content);
              }
            });
            return data;
          },
          // Export collection to HTML element.
          exportToHTML: function() {
            var elements = this.Export();
            var mapId = this.elements.getMap().container.getElement().parentElement.id;
            var $storage = $(this.storagePrefix + mapId);
            $storage.val(JSON.stringify(elements));
          },
          // Add new line or polygon to collection.
          add: function(Element) {
            Element.setParent(this);
            this.elements.add(Element.element);
            return Element;
          },
          // Remove polygon or line from map.
          remove: function(Element) {
            this.elements.remove(Element.element);
          },
          // Init object.
          _init: function(options) {
            this.elements = new ymaps.GeoObjectCollection();
            this.elements.options.set(options);
          }
        };
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Base layouts.
 */

(function($) {
  Drupal.behaviors.yamapsLayouts = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        // Available colors.
        $.yaMaps.colors = {
          blue: '#006cff',
          lightblue: '#66c7ff',
          night: '#004056',
          darkblue: '#00339a',
          green: '#33cc00',
          white: '#ffffff',
          red: '#ff0000',
          orange: '#ffb400',
          darkorange: '#ff6600',
          yellow: '#ffea00',
          violet: '#b832fd',
          pink: '#fd32fb'
        };

        // HTML for colorpicker.
        $.yaMaps.colorsHTML = '';
        for (var i in $.yaMaps.colors) {
          $.yaMaps.colorsHTML += '<div class="yamaps-color"><div data-content="' + i + '">' + $.yaMaps.colors[i] + '</div></div>';
        }

        // Opacity select layout.
        $.yaMaps.addLayout('yamaps#OpacityLayout', ymaps.templateLayoutFactory.createClass([
          '<label for="opacity">' + Drupal.t('Opacity') + '</label>',
          '<select id="opacity">',
          '<option value="1">100%</option>',
          '<option value="0.9">90%</option>',
          '<option value="0.8">80%</option>',
          '<option value="0.7">70%</option>',
          '<option value="0.6">60%</option>',
          '<option value="0.5">50%</option>',
          '<option value="0.4">40%</option>',
          '<option value="0.3">30%</option>',
          '<option value="0.2">20%</option>',
          '<option value="0.1">10%</option>',
          '</select>'
        ].join('')));

        // Stroke width layout.
        $.yaMaps.addLayout('yamaps#StrokeWidthLayout', ymaps.templateLayoutFactory.createClass([
          '<label for="strokeWidth">' + Drupal.t('Stroke width') + '</label>',
          '<select id="strokeWidth">',
          '<option value="7">' + Drupal.t('Very bold') + '</option>',
          '<option value="5">' + Drupal.t('Bold') + '</option>',
          '<option value="3">' + Drupal.t('Normal') + '</option>',
          '<option value="2">' + Drupal.t('Slim') + '</option>',
          '<option value="1">' + Drupal.t('Very slim') + '</option>',
          '</select>'
        ].join('')));

        // ColorPicker layout.
        $.yaMaps.addLayout('yamaps#ColorPicker', ymaps.templateLayoutFactory.createClass(
          '<div class="yamaps-colors">' + $.yaMaps.colorsHTML + '</div>',
          {
            build: function () {
              this.constructor.superclass.build.call(this);
              this.$elements = $(this.getParentElement()).find('.yamaps-color');
              this.$elements.each(function() {
                var $div = $(this).children('div');
                $div.css('background-color', $div.text());
              });
              this.$elements.bind('click', this, this.colorClick)
            },
            clear: function () {
              this.constructor.superclass.build.call(this);
              this.$elements.unbind('click', this, this.colorClick)
            },
            colorClick: function(e) {
              e.data.$elements.removeClass('yamaps-color-active');
              $(this).addClass('yamaps-color-active');
            }
          }
        ));

        // Ballon actions layout.
        $.yaMaps.addLayout('yamaps#ActionsButtons', ymaps.templateLayoutFactory.createClass(
          '<div class="actions"><a id="deleteButton" href="#">' +
            Drupal.t('Delete') +
            '</a><input id="saveButton" type="button" value="' +
            Drupal.t('Save') +
            '"/></div>'
        ));
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Placemarks support plugin.
 */

(function($) {
  Drupal.behaviors.yamapsPlacemarks = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        // Class for one placemark.
        $.yaMaps.YamapsPlacemark = function(geometry, properties, options) {
          this.placemark = new ymaps.Placemark(geometry, properties, options);
          this.parent = null;

          // Set placemark icon and balloon content.
          this.setContent = function(iconContent, balloonContent) {
            this.placemark.properties.set('iconContent', iconContent);
            this.placemark.properties.set('balloonContentHeader', iconContent);
            this.placemark.properties.set('balloonContentBody', balloonContent);
          };

          // Set placemark color.
          this.setColor = function(color) {
            var preset = 'twirl#' + color;
            preset += this.placemark.properties.get('iconContent') ? 'StretchyIcon' : 'DotIcon';
            this.placemark.options.set('preset', preset)
          };

          // Close balloon.
          this.closeBalloon = function() {
            this.placemark.balloon.close();
          };

          // Open balloon.
          this.openBalloon = function() {
            this.placemark.balloon.open();
          };

          // Remove placemark.
          this.remove = function() {
            this.getParent().remove(this);
            this.exportParent();
          };

          // Set placemark parent.
          this.setParent = function(Parent) {
            this.parent = Parent;
          };

          // Get parent.
          this.getParent = function() {
            return this.parent;
          };

          // Export placemark information.
          this.Export = function() {
            var coords = this.placemark.geometry.getCoordinates();
            var props = this.placemark.properties.getAll();
            return {
              coords: coords,
              params: {
                color: props.color,
                iconContent: props.iconContent,
                balloonContentBody: props.balloonContentBody,
                balloonContentHeader: props.iconContent
              }
            };
          };

          // Export all placemarks from this map.
          this.exportParent = function() {
            var collection = this.getParent();
            if (collection) {
              var mapId = collection.elements.getMap().container.getElement().parentElement.id;
              var placemarks = collection.Export();
              var $storage = $('.field-yamaps-placemarks-' + mapId);
              $storage.val(JSON.stringify(placemarks));
            }
          };

          // Placemark events for export.
          this.placemark.events
            .add('dragend', this.exportParent, this)
            .add('propertieschange', this.exportParent, this);

          // Set placemark params.
          this.placemark.properties.set('Placemark', this);
          this.setColor(properties.color);
        };

        // Placemarks collection class.
        $.yaMaps.YamapsPlacemarkCollection = function(options) {
          this.placemarks = [];
          this.elements = new ymaps.GeoObjectCollection();
          this.elements.options.set(options);

          // Add new placemark to collection.
          this.add = function(Placemark) {
            Placemark.setParent(this);
            this.placemarks.push(Placemark);
            this.elements.add(Placemark.placemark);
            return Placemark;
          };

          // Create placemark and add to collection.
          this.createPlacemark = function(geometry, properties, options) {
            return this.add(new $.yaMaps.YamapsPlacemark(geometry, properties, options));
          };

          // Remove placemark.
          this.remove = function(Placemark) {
            this.elements.remove(Placemark.placemark);
            for (var i in this.placemarks) {
              if (this.placemarks[i] === Placemark) {
                this.placemarks.splice(i, 1);
                break;
              }
            }
          };

          // Each placemarks callback.
          this.each = function(callback) {
            for (var i in this.placemarks) {
              callback(this.placemarks[i]);
            }
          };

          // Export collection.
          this.Export = function() {
            var placemarks = [];
            this.each(function(Placemark) {
              placemarks.push(Placemark.Export());
            });
            return placemarks;
          };
        };

        // Edit placemark balloon template.
        $.yaMaps.addLayout('yamaps#PlacemarkBalloonEditLayout',
          ymaps.templateLayoutFactory.createClass(
            [
              '<div class="yamaps-balloon yamaps-placemark-edit">',
              '<div class="form-element">',
              '<label for="iconContent">' + Drupal.t('Placemark text') + '</label>',
              '<input type="text" id="iconContent" value="$[properties.iconContent]"/>',
              '</div>',
              '<div class="form-element placemark-colors">',
              '<label>' + Drupal.t('Color') + '</label>',
              '$[[yamaps#ColorPicker]]',
              '</div>',
              '<div class="form-element">',
              '<label for="balloonContent">' + Drupal.t('Balloon text') + '</label>',
              '<input type="text" id="balloonContent" value="$[properties.balloonContentBody]"/>',
              '</div>',
              '$[[yamaps#ActionsButtons]]',
              '</div>'
            ].join(""),
            {
              build: function () {
                this.constructor.superclass.build.call(this);
                this.properties = this.getData().properties.getAll();
                // Balloon HTML element.
                var $element = $(this.getParentElement());
                var _this = this;

                // Placemark colorpicker.
                this.$placemarkColors = $(this.getParentElement()).find('.placemark-colors .yamaps-color');
                this.$placemarkColors.each(function() {
                  var $this = $(this);
                  var $div = $this.children('div');
                  if (_this.properties.color == $div.attr('data-content')) {
                    $this.addClass('yamaps-color-active');
                  }
                });
                this.$placemarkColors.bind('click', this, this.colorClick);

                // Placemark icon and balloon content.
                this.$iconContent = $element.find('#iconContent');
                this.$balloonContent = $element.find('#balloonContent');

                // Actions.
                $('#deleteButton').bind('click', this, this.onDeleteClick);
                $('#saveButton').bind('click', this, this.onSaveClick);
              },
              clear: function () {
                this.constructor.superclass.build.call(this);
                this.$placemarkColors.unbind('click', this, this.colorClick);
                $('#deleteButton').unbind('click', this, this.onDeleteClick);
                $('#saveButton').unbind('click', this, this.onSaveClick);

              },
              colorClick: function(e) {
                // Colorpicker click.
                e.data.properties.color = $(this).children('div').attr('data-content');
              },
              onDeleteClick: function (e) {
                // Delete click.
                e.data.properties.Placemark.remove();
                e.preventDefault();
              },
              onSaveClick: function(e) {
                // Save click.
                var placemark = e.data.properties.Placemark;
                // Save content, color and close balloon.
                placemark.setContent(e.data.$iconContent.val(), e.data.$balloonContent.val());
                placemark.setColor(e.data.properties.color);
                placemark.closeBalloon();
              }
            }
          )
        );

        // Add placemarks support to map.
        $.yaMaps.addMapTools(function(Map) {
          // Default options.
          var options = {
            balloonMaxWidth: 300,
            balloonCloseButton: true
          };
          if (Map.options.edit) {
            // If map in edit mode set edit mode to placemarks options.
            options.balloonContentLayout = 'yamaps#PlacemarkBalloonEditLayout';
            options.draggable = true;
          }

          // Create new collection.
          var placemarksCollection = new $.yaMaps.YamapsPlacemarkCollection(options);

          // Add already created elements to collection.
          for (var i in Map.options.placemarks) {
            placemarksCollection.add(new $.yaMaps.YamapsPlacemark(Map.options.placemarks[i].coords, Map.options.placemarks[i].params, Map.options.placemarks[i].options));
          }
          // Add collection to the map.
          Map.map.geoObjects.add(placemarksCollection.elements);

          // If map in view mode exit.
          if (!Map.options.edit) {
            return;
          }

          // If map in edit mode add search form.
          var $searchForm = $([
            '<form class="yamaps-search-form">',
            '<input type="text" class="form-text" placeholder="' + Drupal.t('Search on the map') + '" value=""/>',
            '<input type="submit" class="form-submit" value="' + Drupal.t('Search') + '"/>',
            '</form>'].join(''));

          $searchForm.bind('submit', function (e) {
            var searchQuery = $searchForm.children('input').val();
            // Find one element.
            ymaps.geocode(searchQuery, {results: 1}, {results: 100}).then(function (res) {
              var geoObject = res.geoObjects.get(0);
              if (!geoObject) {
                alert(Drupal.t('Not found'));
                return;
              }
              var coordinates = geoObject.geometry.getCoordinates();
              var params = geoObject.properties.getAll();
              // Create new placemark.
              var Placemark = new $.yaMaps.YamapsPlacemark(coordinates, {
                iconContent: params.name,
                balloonHeaderContent: params.name,
                balloonContentBody: params.description,
                color: 'white'
              });
              placemarksCollection.add(Placemark);
              Placemark.openBalloon();
              // Pan to new placemark.
              Map.map.panTo(coordinates, {
                checkZoomRange: false,
                delay: 0,
                duration: 1000,
                flying: true
              });
            });
            e.preventDefault();
          });
          // Add search form after current map.
          $searchForm.insertAfter('#' + Map.mapId);

          // Map click listener to adding new placemark.
          var mapClick = function(event) {
            var Placemark = placemarksCollection.createPlacemark(event.get('coordPosition'), {iconContent: '', color: 'blue', balloonContentBody: '', balloonContentHeader: ''});
            Placemark.openBalloon();
          };

          // New button.
          var pointButton = new ymaps.control.Button({
            data: {
              content: '<ymaps class="ymaps-b-form-button__text"><ymaps class="ymaps-b-ico ymaps-b-ico_type_point"></ymaps></ymaps>',
              title: Drupal.t('Setting points')
            }
          });

          // Button events.
          pointButton.events
            .add('select', function(event) {
              Map.cursor = Map.map.cursors.push('pointer');
              Map.mapListeners.add('click', mapClick);
            })
            .add('deselect', function(event) {
              Map.cursor.remove();
              Map.mapListeners.remove('click', mapClick);
            });

          return pointButton;
        });
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Polylines support plugin.
 */

(function($) {
  Drupal.behaviors.yamapsLine = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        // Class for one line.
        $.yaMaps.YamapsLine = function(geometry, properties, options) {
          this._init(new ymaps.Polyline(geometry, properties, options));
        };
        $.yaMaps.YamapsLine.prototype = $.yaMaps.BaseYamapsObject;

        // Class for lines collection.
        $.yaMaps.YamapsLineCollection = function(options) {
          this._init(options);
          // Selector "storagePrefix + MAP_ID" will be used
          // for export collection data.
          this.storagePrefix = '.field-yamaps-lines-';

          // Create line and add to collection.
          this.createLine = function(geometry, properties, options) {
            return this.add(new $.yaMaps.YamapsLine(geometry, properties, options));
          };
        };
        $.yaMaps.YamapsLineCollection.prototype = $.yaMaps.BaseYamapsObjectCollection;

        // Edit line balloon template.
        $.yaMaps.addLayout('yamaps#LineBalloonEditLayout',
          ymaps.templateLayoutFactory.createClass(
            [
              '<div class="yamaps-balloon yamaps-line-edit">',
              '<div class="form-element line-colors">',
              '<label>' + Drupal.t('Line color') + '</label>',
              '$[[yamaps#ColorPicker]]',
              '</div>',
              '<div class="form-element line-width">',
              '$[[yamaps#StrokeWidthLayout]]',
              '</div>',
              '<div class="form-element line-opacity">',
              '$[[yamaps#OpacityLayout]]',
              '</div>',
              '<div class="form-element">',
              '<label for="balloonContent">' + Drupal.t('Balloon text') + '</label>',
              '<input type="text" id="balloonContent" value="$[properties.balloonContent]"/>',
              '</div>',
              '$[[yamaps#ActionsButtons]]',
              '</div>'
            ].join(""),
            {
              build: function () {
                this.constructor.superclass.build.call(this);
                this.properties = this.getData().properties.getAll();
                // Balloon HTML element.
                var $element = $(this.getParentElement());
                var _this = this;

                // Line colorpicker.
                this.$lineColors = $element.find('.line-colors .yamaps-color');
                this.$lineColors.each(function() {
                  // Set colorpicker parameters.
                  var $this = $(this);
                  var $div = $this.children('div');
                  if (_this.properties.strokeColor == $div.attr('data-content')) {
                    $this.addClass('yamaps-color-active');
                  }
                });
                this.$lineColors.bind('click', this, this.strokeColorClick);

                // Opacity.
                this.$opacity = $element.find('.line-opacity select');
                this.$opacity.val(_this.properties.opacity);

                // Stroke width.
                this.$width = $element.find('.line-width select');
                this.$width.val(_this.properties.strokeWidth);

                // Balloon content.
                this.$balloonContent = $element.find('#balloonContent');

                // Actions.
                $('#deleteButton').bind('click', this, this.onDeleteClick);
                $('#saveButton').bind('click', this, this.onSaveClick);
              },
              clear: function () {
                this.constructor.superclass.build.call(this);
                this.$lineColors.unbind('click', this, this.strokeColorClick);
                $('#deleteButton').unbind('click', this, this.onDeleteClick);
                $('#saveButton').unbind('click', this, this.onSaveClick);

              },
              strokeColorClick: function(e) {
                // Click to colorpicker.
                e.data.properties.strokeColor = $(this).children('div').attr('data-content');
              },
              onDeleteClick: function (e) {
                // Delete link click.
                e.data.properties.element.remove();
                e.preventDefault();
              },
              onSaveClick: function(e) {
                // Save button click.
                var line = e.data.properties.element;
                // Set opacity.
                e.data.properties.opacity = e.data.$opacity.val();
                line.setOpacity(e.data.properties.opacity);
                // Set width.
                e.data.properties.strokeWidth = e.data.$width.val();
                line.setWidth(e.data.properties.strokeWidth);
                // Set color.
                line.setColor(e.data.properties.strokeColor);
                // Set balloon content.
                line.setContent(e.data.$balloonContent.val());
                // Close balloon.
                line.closeBalloon();
              }
            }
          )
        );

        // Add lines support to map.
        $.yaMaps.addMapTools(function(Map) {
          // Default options.
          var options = {
            balloonMaxWidth: 300,
            balloonCloseButton: true,
            strokeWidth: 3,
            elements: {}
          };
          if (Map.options.edit) {
            // If map in edit mode set edit mode to lines options.
            options.balloonContentLayout = 'yamaps#LineBalloonEditLayout';
            options.draggable = true;
          }

          // Create lines collection.
          var linesCollection = new $.yaMaps.YamapsLineCollection(options);

          // Add empty collection to the map.
          Map.map.geoObjects.add(linesCollection.elements);

          // Add already created lines to map.
          for (var i in Map.options.lines) {
            var Line = linesCollection.createLine(Map.options.lines[i].coords, Map.options.lines[i].params);
            if (Map.options.edit) {
              Line.startEditing();
            }
          }

          // If map in view mode exit.
          if (!Map.options.edit) {
            return;
          }

          // If map in edit mode set map click listener to adding new line.
          var mapClick = function(event) {
            var Line = linesCollection.createLine([event.get('coordPosition')], {balloonContent: '', strokeColor: 'blue', opacity: 0.8, strokeWidth: 3});
            Line.startEditing(true);
          };

          // Add new button.
          var lineButton = new ymaps.control.Button({
            data: {
              content: '<ymaps class="ymaps-b-form-button__text"><ymaps class="ymaps-b-ico ymaps-b-ico_type_line"></ymaps></ymaps>',
              title: Drupal.t('Drawing lines')
            }
          });

          // Button actions.
          lineButton.events
            .add('select', function(event) {
              Map.cursor = Map.map.cursors.push('pointer');
              Map.mapListeners.add('click', mapClick);
            })
            .add('deselect', function(event) {
              Map.cursor.remove();
              Map.mapListeners.remove('click', mapClick);
            });

          return lineButton;
        });
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Polygons support plugin.
 */

(function($) {
  Drupal.behaviors.yamapsPolygon = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        // Class for one polygon.
        $.yaMaps.YamapsPolygon = function(geometry, properties, options) {
          this._init(new ymaps.Polygon(geometry, properties, options));
        };
        $.yaMaps.YamapsPolygon.prototype = $.yaMaps.BaseYamapsObject;

        // Class for polygons collection.
        $.yaMaps.YamapsPolygonCollection = function(options) {
          this._init(options);
          // Selector "storagePrefix + MAP_ID" will be used
          // for export collection data.
          this.storagePrefix = '.field-yamaps-polygons-';

          // Create polygon and add to collection.
          this.createPolygon = function(geometry, properties, options) {
            return this.add(new $.yaMaps.YamapsPolygon(geometry, properties, options));
          };
        };
        $.yaMaps.YamapsPolygonCollection.prototype = $.yaMaps.BaseYamapsObjectCollection;

        // Edit polygon balloon template.
        $.yaMaps.addLayout('yamaps#PolygonBalloonEditLayout',
          ymaps.templateLayoutFactory.createClass(
            [
              '<div class="yamaps-balloon yamaps-polygon-edit">',
              '<div class="form-element line-colors">',
              '<label>' + Drupal.t('Line color') + '</label>',
              '$[[yamaps#ColorPicker]]',
              '</div>',
              '<div class="form-element poly-colors">',
              '<label>' + Drupal.t('Polygon color') + '</label>',
              '$[[yamaps#ColorPicker]]',
              '</div>',
              '<div class="form-element line-width">',
              '$[[yamaps#StrokeWidthLayout]]',
              '</div>',
              '<div class="form-element poly-opacity">',
              '$[[yamaps#OpacityLayout]]',
              '</div>',
              '<div class="form-element">',
              '<label for="balloonContent">' + Drupal.t('Balloon text') + '</label>',
              '<input type="text" id="balloonContent" value="$[properties.balloonContent]"/>',
              '</div>',
              '$[[yamaps#ActionsButtons]]',
              '</div>'
            ].join(""),
            {
              build: function () {
                this.constructor.superclass.build.call(this);
                this.properties = this.getData().properties.getAll();
                // Balloon HTML element.
                var $element = $(this.getParentElement());
                var _this = this;

                // Polygon background colorpicker.
                this.$polyColors = $element.find('.poly-colors .yamaps-color');
                this.$polyColors.each(function() {
                  var $this = $(this);
                  var $div = $this.children('div');
                  if (_this.properties.fillColor == $div.attr('data-content')) {
                    $this.addClass('yamaps-color-active');
                  }
                });
                this.$polyColors.bind('click', this, this.fillColorClick);

                // Polygon line colorpicker.
                this.$lineColors = $element.find('.line-colors .yamaps-color');
                this.$lineColors.each(function() {
                  var $this = $(this);
                  var $div = $this.children('div');
                  if (_this.properties.strokeColor == $div.attr('data-content')) {
                    $this.addClass('yamaps-color-active');
                  }
                });
                this.$lineColors.bind('click', this, this.strokeColorClick);

                // Opacity.
                this.$opacity = $element.find('.poly-opacity select');
                this.$opacity.val(_this.properties.opacity);

                // Stroke width.
                this.$width = $element.find('.line-width select');
                this.$width.val(_this.properties.strokeWidth);

                // Balloon content.
                this.$balloonContent = $element.find('#balloonContent');

                // Actions.
                $('#deleteButton').bind('click', this, this.onDeleteClick);
                $('#saveButton').bind('click', this, this.onSaveClick);
              },
              clear: function () {
                this.constructor.superclass.build.call(this);
                this.$polyColors.unbind('click', this, this.fillColorClick);
                this.$lineColors.unbind('click', this, this.strokeColorClick);
                $('#deleteButton').unbind('click', this, this.onDeleteClick);
                $('#saveButton').unbind('click', this, this.onSaveClick);
              },
              fillColorClick: function(e) {
                // Fill colorpicker click.
                e.data.properties.fillColor = $(this).children('div').attr('data-content');
              },
              strokeColorClick: function(e) {
                // Stroke colorpicker click.
                e.data.properties.strokeColor = $(this).children('div').attr('data-content');
              },
              onDeleteClick: function (e) {
                // Delete click.
                e.data.properties.element.remove();
                e.preventDefault();
              },
              onSaveClick: function(e) {
                // Save click.
                var polygon = e.data.properties.element;
                // Set opacity.
                e.data.properties.opacity = e.data.$opacity.val();
                polygon.setOpacity(e.data.properties.opacity);
                // Set stroke width.
                e.data.properties.strokeWidth = e.data.$width.val();
                polygon.setWidth(e.data.properties.strokeWidth);
                // Set colors.
                polygon.setColor(e.data.properties.strokeColor, e.data.properties.fillColor);
                // Set balloon content.
                polygon.setContent(e.data.$balloonContent.val());
                polygon.closeBalloon();
              }
            }
          )
        );

        // Add polygons support to map.
        $.yaMaps.addMapTools(function(Map) {
          // Default options.
          var options = {
            balloonMaxWidth: 300,
            balloonCloseButton: true,
            strokeWidth: 3,
            elements: {}
          };
          if (Map.options.edit) {
            // If map in edit mode set edit mode to polygons options.
            options.balloonContentBodyLayout = 'yamaps#PolygonBalloonEditLayout';
            options.draggable = true;
          }

          // Create polygons collection.
          var polygonsCollection = new $.yaMaps.YamapsPolygonCollection(options);

          // Add empty collection to the map.
          Map.map.geoObjects.add(polygonsCollection.elements);

          // Add already created polygons to map.
          for (var i in Map.options.polygons) {
            var Polygon = polygonsCollection.createPolygon(Map.options.polygons[i].coords, Map.options.polygons[i].params);
            if (Map.options.edit) {
              Polygon.startEditing();
            }
          }

          // If map in view mode exit.
          if (!Map.options.edit) {
            return;
          }

          // If map in edit mode set map click listener to adding new polygon.
          var mapClick = function(event) {
            var Polygon = polygonsCollection.createPolygon([[event.get('coordPosition')]], {balloonContent: '', fillColor: 'lightblue', strokeColor: 'blue', opacity: 0.6, strokeWidth: 3});
            Polygon.startEditing(true);
          };

          // Add new button.
          var polygonButton = new ymaps.control.Button({
            data: {
              content: '<ymaps class="ymaps-b-form-button__text"><ymaps class="ymaps-b-ico ymaps-b-ico_type_poly"></ymaps></ymaps>',
              title: Drupal.t('Drawing polygons')
            }
          });

          // Button actions.
          polygonButton.events
            .add('select', function(event) {
              Map.cursor = Map.map.cursors.push('pointer');
              Map.mapListeners.add('click', mapClick);
            })
            .add('deselect', function(event) {
              Map.cursor.remove();
              Map.mapListeners.remove('click', mapClick);
            });

          return polygonButton;
        });
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Routes support plugin.
 */

(function($) {
  Drupal.behaviors.yamapsRoute = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        // Add routes support to map.
        $.yaMaps.addMapTools(function(Map) {
          // Start and end of route.
          var firstPoint = null;
          var secondPoint = null;

          // Export route to html element.
          var exportRoute = function(start, end) {
            var mapId = Map.map.container.getElement().parentElement.id;
            var $storage = $('.field-yamaps-routes-' + mapId);
            if (!start || !end) {
              $storage.val('');
            }
            else {
              $storage.val(JSON.stringify([start, end]));
            }
          };

          // Write route on map.
          var writeRoute = function(start, end, route) {
            ymaps.route([start, end], {mapStateAutoApply: false}).then(
              function (newRoute) {
                // If route already added - remove it.
                if (route) {
                  Map.map.geoObjects.remove(route);
                }
                // Add new route to map.
                Map.map.geoObjects.add(newRoute);

                // Create placemarks.
                var points = newRoute.getWayPoints();
                var pointStart = points.get(0);
                var pointEnd = points.get(1);
                pointStart.options.set('preset', 'twirl#carIcon');
                pointEnd.options.set('preset', 'twirl#houseIcon');

                if (Map.options.edit) {
                  // If map in edit mode - export route.
                  exportRoute(start, end);

                  // Set points edit mode.
                  points.options.set('draggable', true);

                  // Rewrite route when point moved.
                  points.events.add('dragend', function() {
                    writeRoute(this.start.geometry.getCoordinates(), this.end.geometry.getCoordinates(), newRoute);
                  }, {start: pointStart, end: pointEnd});

                  // Delete route when point clicked.
                  points.events.add('click', function() {
                    Map.map.geoObjects.remove(this);
                    firstPoint = secondPoint = null;
                    exportRoute(null, null);
                  }, newRoute);
                }
              },
              function (error) {
                if (!route) {
                  firstPoint = secondPoint = null;
                }
                alert(Drupal.t('Error found') + ": " + error.message);
              }
            );
          };

          // Add already created route to map.
          if (Map.options.routes) {
            firstPoint = Map.options.routes[0];
            secondPoint = Map.options.routes[1];
            writeRoute(firstPoint, secondPoint);
          }

          // If map in view mode - exit.
          if (!Map.options.edit) {
            return;
          }

          // If map in edit mode set map click listener to adding route.
          var mapClick = function(event) {
            if (!firstPoint) {
              // First click - create placemark.
              firstPoint = new ymaps.Placemark(event.get('coordPosition'), {}, {
                balloonCloseButton: true,
                preset: 'twirl#carIcon'
              });
              Map.map.geoObjects.add(firstPoint);
            }
            else if (!secondPoint) {
              // Second click - remove placemark and add route.
              var first = firstPoint.geometry.getCoordinates();
              Map.map.geoObjects.remove(firstPoint);
              secondPoint = event.get('coordPosition');
              writeRoute(first, secondPoint, null);
            }
            else {
              // Third click - alert.
              alert(Drupal.t('The route is already on this map'));
            }
          };

          // Add new button.
          var routeButton = new ymaps.control.Button({
            data: {
              content: '<ymaps class="ymaps-b-form-button__text"><ymaps class="ymaps-b-ico ymaps-b-ico_type_route"></ymaps></ymaps>',
              title: Drupal.t('Laying routes')
            }
          });

          // Button actions.
          routeButton.events
            .add('select', function(event) {
              Map.cursor = Map.map.cursors.push('pointer');
              Map.mapListeners.add('click', mapClick);
            })
            .add('deselect', function(event) {
              Map.cursor.remove();
              Map.mapListeners.remove('click', mapClick);
            });

          return routeButton;
        });
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Map support.
 */

(function($) {
  Drupal.behaviors.yamapsMaps = {
    attach: function (context, settings) {
      ymaps.ready(function() {
        // Basic map class.
        $.yaMaps.YamapsMap = function(mapId, options) {
          this.map = new ymaps.Map(mapId, options.init);
          this.mapId = mapId;
          this.options = options;
          this.mapListeners = this.map.events.group();
          $.yaMaps.maps[mapId] = this;

          // Export map coordinates to html element.
          this.exportCoords = function(event) {
            var coords = {
              center: event.get('newCenter'),
              zoom: event.get('newZoom')
            };
            var $storage = $('.field-yamaps-coords-' + mapId);
            $storage.val(JSON.stringify(coords));
          };

          // Export map type to html element.
          this.exportType = function(event) {
            var type = event.get('newType');
            var $storage = $('.field-yamaps-type-' + mapId);
            $storage.val(type);
          };

          // Map events for export.
          this.map.events
            .add('boundschange', this.exportCoords, this.map)
            .add('typechange', this.exportType, this.map);

          // Right top controls.
          var rightTopControlGroup = [];

          // Enable map controls.
          this.enableControls = function() {
            rightTopControlGroup.push('typeSelector');
            var mapSize = this.map.container.getSize();
            if (mapSize[1] < 270) {
              this.map.controls.add('smallZoomControl', {right: 5, top: 50});
            }
            else {
              this.map.controls.add('zoomControl', {right: 5, top: 50});
            }
            $.yaMaps._mapTools.unshift('default');
          };

          // Enable traffic control.
          this.enableTraffic = function() {
            var traffic = new ymaps.control.TrafficControl({
              providerKey:'traffic#actual',
              shown:true
            });
            traffic.getProvider().state.set('infoLayerShown', true);
            traffic.state.set('expanded', false);
            rightTopControlGroup.unshift(traffic);
          };

          // Enable plugins.
          this.enableTools = function() {
            var mapTools = $.yaMaps.getMapTools(this);
            this.map.controls.add(new ymaps.control.MapTools(mapTools), {left: 5, top: 5});

            if (rightTopControlGroup.length > 0) {
              var groupControl = new ymaps.control.Group({
                items: rightTopControlGroup
              });
              this.map.controls.add(groupControl, {right: 5, top: 5});
            }
          };
        };
      });
    }
  }
})(jQuery);
;
/**
 * @file
 * Runs map.
 */

(function($) {
  Drupal.behaviors.yamapsRun = {
    attach: function (context, settings) {
      ymaps.ready(function () {
        function creating_map(mapId, options) {
          $('#' + mapId).once('yamaps', function () {
            // If zoom and center are not set - set it from user's location.
            if (!options.init.center || !options.init.zoom) {
              var location = ymaps.geolocation;
              // Set map center.
              if (!options.init.center) {
                // Set location, defined by ip, if they not defined.
                options.init.center = [location.latitude, location.longitude];
              }
              if (!options.init.zoom) {
                options.init.zoom = location.zoom ? location.zoom : 10;
              }
            }
            // Create new map.
            var map = new $.yaMaps.YamapsMap(mapId, options);
            if (options.controls) {
              // Enable controls.
              map.enableControls();
            }
            if (options.traffic) {
              // Enable traffic.
              map.enableTraffic();
            }
            // Enable plugins.
            map.enableTools();
          });
        }

        function processMaps() {
          if (Drupal.settings.yamaps) {
            for (var mapId in Drupal.settings.yamaps) {
              var options = Drupal.settings.yamaps[mapId];
              creating_map(mapId, options);
            }
          }
        }

        function openMap(selectorOpen, selectorClose) {
          $('div' + selectorOpen).click(function() {
            var mapId = $(this).attr('mapid');
            $('#' + mapId).removeClass('element-invisible');
            $(this).addClass('element-invisible');
            $('div[mapid="' + mapId + '"]' + selectorClose).removeClass('element-invisible');
          });

          $('div' + selectorClose).click(function() {
            var mapId = $(this).attr('mapid');
            $('#' + mapId).addClass('element-invisible');
            $(this).addClass('element-invisible');
            $('div[mapid="' + mapId + '"]' + selectorOpen).removeClass('element-invisible');
          })
        }

        // Initialize layouts.
        $.yaMaps.initLayouts();
        processMaps();
        openMap('.open_yamap_button', '.close_yamap_button');
      })
    }
  }
})(jQuery);
;
