/**
 * Scandi_MagicZoom
 * @author Janis Kozulis <info@scandiweb.com>
 */
define([
    'jquery',
    'slick',
    'elevatezoom',
    'fancybox',
    'uiClass',
    'Magento_ProductVideo/js/load-player',
    'Magento_Ui/js/modal/modal'
], function ($, slick, elevatezoom, fancybox, Class) {
    'use strict';

    /**
     * @param href
     * @returns {Element}
     */
    function parseHref(href) {
        var a = document.createElement('a');

        a.href = href;

        return a;
    }

    /**
     * @param href
     * @param forceVideo
     * @returns {*}
     */
    function parseVideoURL(href, forceVideo) {
        var id,
            type,
            ampersandPosition,
            vimeoRegex;

        /**
         * Get youtube ID
         * @param {String} srcid
         * @returns {{}}
         */
        function _getYoutubeId(srcid) {
            if (srcid) {
                ampersandPosition = srcid.indexOf('&');

                if (ampersandPosition === -1) {
                    return srcid;
                }

                srcid = srcid.substring(0, ampersandPosition);
            }

            return srcid;
        }

        if (typeof href !== 'string') {
            return href;
        }

        href = parseHref(href);

        if (href.host.match(/youtube\.com/) && href.search) {
            id = href.search.split('v=')[1];

            if (id) {
                id = _getYoutubeId(id);
                type = 'youtube';
            }
        } else if (href.host.match(/youtube\.com|youtu\.be/)) {
            id = href.pathname.replace(/^\/(embed\/|v\/)?/, '').replace(/\/.*/, '');
            type = 'youtube';
        } else if (href.host.match(/vimeo\.com/)) {
            type = 'vimeo';
            vimeoRegex = new RegExp(['https?:\\/\\/(?:www\\.|player\\.)?vimeo.com\\/(?:channels\\/(?:\\w+\\/)',
                '?|groups\\/([^\\/]*)\\/videos\\/|album\\/(\\d+)\\/video\\/|video\\/|)(\\d+)(?:$|\\/|\\?)'
            ].join(''));
            id = href.href.match(vimeoRegex)[3];
        }

        if ((!id || !type) && forceVideo) {
            id = href.href;
            type = 'custom';
        }

        return id ? {
            id: id, type: type, s: href.search.replace(/^\?/, '')
        } : false;
    }

    /**
     * Swatch script is calling this :\
     */
    $.widget('mage.AddFotoramaVideoEvents', {
        _create: function () {
            // Dummy widget
        }
    });

    /**
     * Removed hardcoded protocol from URL
     */
    $.widget('mage.videoVimeo', $.mage.videoVimeo, {
        /**
         * Initialize the Vimeo widget
         * @private
         */
        _create: function () {
            var timestamp,
                additionalParams = '',
                src;

            this._initialize();
            timestamp = new Date().getTime();
            this._autoplay = true;

            if (this._autoplay) {
                additionalParams += '&autoplay=1';
            }

            if (this._loop) {
                additionalParams += '&loop=1';
            }
            src = '//player.vimeo.com/video/' +
                this._code + '?api=1&player_id=vimeo' +
                this._code +
                timestamp +
                additionalParams;
            this.element.append(
                $('<iframe/>')
                    .attr('frameborder', 0)
                    .attr('id', 'vimeo' + this._code + timestamp)
                    .attr('width', this._width)
                    .attr('height', this._height)
                    .attr('src', src)
                    .attr('webkitallowfullscreen', '')
                    .attr('mozallowfullscreen', '')
                    .attr('allowfullscreen', '')
            );
            this._player = window.$f(this.element.children(':first')[0]);

            // Froogaloop throws error without a registered ready event
            this._player.addEvent('ready', function (id) {
                $('#' + id).closest('.fotorama__stage__frame').addClass('fotorama__product-video--loaded');
            });
        }
    });

    /**
     *
     */
    return Class.extend({
        /**
         * Classes used for linking main and thumbnail sliders
         */
        GALLERY_CLASS: 'mz-main-slider',
        THUMBS_CLASS: 'mz-gallery-thumbs',
        VIDEOCONTAINER: 'mz-product-video',
        VIDEOLOADED: 'video-loaded',

        defaults: {
            data: [],
            sliderSettings: {
                options: {}
            },
            imagePopup: {
                options: {}
            },
            thumbsSettings: {
                options: {}
            },
            zoomSettings: {
                options: {}
            },
            videoSettings: {
            }
        },

        isTouchEnabled: (function () {
            return 'ontouchstart' in document.documentElement;
        })(),

        /**
         *
         * @param config Configuration object
         * @param element Slider wrapper element
         */
        initialize: function (config, element) {
            var self = this;

            this.config = $.extend(true, this.defaults, config);
            this.config.sliderSettings.options.asNavFor = '.' + this.THUMBS_CLASS;
            this.config.thumbsSettings.options.asNavFor = '.' + this.GALLERY_CLASS;

            this.prepareVideoData();

            this.sliderElement = $(element);

            this.initSlider();

            this.initApi();

            /* Bug: https://github.com/magento/magento2/issues/7399 */
            $(document).on('click', '.mz-video-modal', function(e) {
                e.stopImmediatePropagation();
                $('.modals-overlay').trigger('click');
            });
        },

        /**
         *
         */
        initSlider: function() {
            var self = this;
            var imagePopOptions = this.config.imagePopup.options;

            this.sliderElement.removeClass('_block-content-loading');

            this.sliderElement.addClass(this.GALLERY_CLASS);
            this.sliderElement.slick(this.config.sliderSettings.options);

            if (this.config.imagePopup.imagePopupStatus) {
                if (this.isTouchEnabled) {
                    self.imageModalPopup('taphold', imagePopOptions);
                } else {
                    self.imageModalPopup('click', imagePopOptions);
                }
            }

            // Add slides
            this.addSlides();

            if (this.isZoomEnabled()) {
                self.initZoom(this.sliderElement);
                self.videoContainer();

                $(document).on('mouseover', '.zoomContainer', $.proxy(this.pauseSlider, this));
                $(document).on('mouseout', '.zoomContainer', $.proxy(this.playSlider, this));
            } else {
                self.videoContainer();
            }

            this.initThumbs();
        },

        /**
         * Inits video container
         */
        videoContainer: function () {
            var self = this;
            self.createVideoContainer();

            this.sliderElement.on('afterChange', function (event, slick, currentSlide) {
                self.initZoom($(event.target));
                self.unloadVideoPlayer();
                self.createVideoContainer();
            });
        },

        /**
         * Image modal popup
         *
         * @returns {boolean}
         */
        imageModalPopup: function (event, config) {
            $(document).on(event, '.slick-slide-wrap.slick-current', function(e) {
                var visibleLinks = $('.slick-slide-wrap:not(.slick-cloned)');
                $.fancybox.open( visibleLinks, config, visibleLinks.index( this ) );

                return false;
            });
        },

        /**
         *
         */
        addSlides: function () {
            var self = this;
            $.each(this.config.data, function (index, imageData) {
                var _className = (self.isVideo(imageData)) ? 'slick-video-slide' : '',
                    _hrefLink = (self.isVideo(imageData)) ? imageData['videoUrl'] : imageData['full'],
                    _fancyBox = (self.config.imagePopup.imagePopupStatus) ? 'href="' + _hrefLink + '"' : '',
                    _slide = '<div class="slick-slide-wrap '+ _className +'" data-data-index="' + index + '" ' + _fancyBox + '><img data-media-type="' + imageData['mediaType'] + '" data-zoom-image="'+ imageData['full'] +'" src="' + imageData['img'] + '"/></div>';

                self.sliderElement.slick('slickAdd', _slide);
            });
        },

        /**
         *
         */
        initThumbs: function () {
            var self = this;

            this.thumbsElement = $('<div/>', {'class': this.THUMBS_CLASS});
            this.sliderElement.parent().find('.mz-gallery-thumbs-wrap').append(this.thumbsElement);

            this.thumbsElement.slick(this.config.thumbsSettings.options);

            // Make thumbnails
            this.addThumbs();
        },

        /**
         *
         */
        addThumbs: function () {
            var self = this;
            $.each(this.config.data, function (index, imageData) {
                var _className = (self.isVideo(imageData)) ? 'slick-video-slide' : '',
                     _thumb = '<div class="thumb ' + _className + '"><img src="' + imageData['thumb'] + '"/></div>';
                self.thumbsElement.slick('slickAdd', _thumb);
            });
        },

        /**
         *
         */
        initZoom: function (element) {
            if (this.isZoomEnabled()) {
                // Clear previous zoom
                $('.zoomContainer').remove();

                var options = this.config.zoomSettings.options;
                // Check if there's enough space for zoom and force inner if necessary
                if (this.config.zoomSettings.autoType) {
                    var windowWidth = $(window).width(),
                        galleryWidth = this.sliderElement.width(),
                        zoomWidth = this.config.zoomSettings.options.zoomWindowWidth
                            ? this.config.zoomSettings.options.zoomWindowWidth : 400;

                    if ((windowWidth - galleryWidth) < zoomWidth) {
                        options.zoomType = 'inner';
                    }
                }

                var currentImage = element.find('.slick-current img');
                if (currentImage.data('media-type') !== 'image') {
                    return;
                }

                if (this.isTouchEnabled) {
                    /**
                     * Create zoom elements on double tap so we can use Slick swipe
                     * Note: Won't work properly if zoomTouchActivation is explicitly set to anything other than "tap"
                     */
                    currentImage.off('doubletap');
                    currentImage.on('doubletap', function (e) {
                        options.onZoomedImageLoaded = function(zoom) {
                            var event = {pageX : e.x, pageY : e.y};
                            zoom.setPosition(event);
                            zoom.setElements('show');
                        };
                        options.onDestroy = function () {
                            $('.zoomContainer').remove();
                        };
                        $(this).elevateZoom(options);
                    })
                } else {
                    currentImage.elevateZoom(options);
                }
            }
        },

        /**
         *
         */
        reInitSlider: function () {
            var slick = this.sliderElement.slick('getSlick'),
                slides = slick.$slides,
                slickThumbs = this.thumbsElement.slick('getSlick'),
                thumbs = slickThumbs.$slides;

            // Remove slides
            while (slides.length !== 0) {
                this.sliderElement.slick('slickRemove', --slides.length);
            }

            // Remove thumbs
            while (thumbs.length !== 0) {
                this.thumbsElement.slick('slickRemove', --thumbs.length);
            }

            this.addSlides();
            this.addThumbs();
            this.initZoom(this.sliderElement);
        },

        /**
         *
         */
        playSlider: function () {
            if (this.config.sliderSettings.options.autoplay) {
                this.sliderElement.slick('slickPlay');
            }
        },

        /**
         *
         */
        pauseSlider: function () {
            if (this.config.sliderSettings.options.autoplay) {
                this.sliderElement.slick('slickPause');
            }
        },

        /**
         *
         * @returns {boolean}
         */
        isZoomEnabled: function () {
            return this.config.zoomSettings.zoomEnabled;
        },

        /**
         *
         * @param item
         * @returns {*|boolean}
         */
        isVideo: function (item) {
            return (item.mediaType && item.mediaType === 'external-video');
        },

        /**
         *
         */
        prepareVideoData: function () {
            var data = this.config.data;
            for (var i = 0; i < data.length; i++) {
                if (this.isVideo(data[i])) {
                    var dataUrl = data[i].videoUrl;
                    dataUrl = parseVideoURL(dataUrl);

                    data[i].id = dataUrl.id;
                    data[i].provider = dataUrl.type;


                    if (dataUrl.type === 'vimeo') {
                        this.loadVimeoJSFramework();
                    }
                }
            }
        },

        /**
         *
         */
        createVideoContainer: function () {
            var currentSlide = this.sliderElement.find('.slick-current'),
                currentImage = this.sliderElement.find('.slick-current img'),
                data = this.config.data[currentSlide.data('data-index')];

            if (currentImage.data('media-type') === 'image' || currentSlide.find('.' + this.VIDEOCONTAINER).length > 0) {
                return;
            }

            currentSlide.append(
                '<div class="' +
                this.VIDEOCONTAINER +
                '" data-related="' +
                this.config.videoSettings.showRelated +
                '" data-loop="' +
                this.config.videoSettings.videoAutoRestart +
                '" data-type="' +
                data.provider +
                '" data-code="' +
                data.id +
                '" data-width="100%" data-height="100%"></div>'
            );

            if (!this.config.imagePopup.imagePopupStatus) {
                this.setVideoEvents(currentSlide);
            }
        },

        /**
         *
         */
        setVideoEvents: function (currentSlide) {
            currentSlide
                .off('click tap', $.proxy(this.videoClickHandler, this))
                .on('click tap', $.proxy(this.videoClickHandler, this));
        },

        /**
         *
         */
        videoClickHandler: function (event) {
            var self = this;

            if ($(event.target).find('iframe').length === 0) {
                var videoContainer = $(event.target).find('.' + this.VIDEOCONTAINER);
                videoContainer.productVideoLoader();

                if (this.config.sliderSettings.videoPopup) { // show in modal
                    videoContainer.modal({
                        clickableOverlay: true,
                        innerScroll: false,
                        modalClass: 'mz-video-modal',
                        buttons: [],
                        closed: function () {
                            videoContainer.remove();
                            self.unloadVideoPlayer();
                        }
                    }).trigger('openModal');
                } else {
                    $(event.target).addClass(this.VIDEOLOADED);
                }

                self.pauseSlider();
            }
        },

        /**
         *
         */
        unloadVideoPlayer: function () {
            var self = this;
            this.sliderElement.find('.' + this.VIDEOCONTAINER).each(function () {
                var $item = $(this).parent(),
                    cloneVideoDiv,
                    iframeElement = $(this).find('iframe');

                if (iframeElement.length === 0) {
                    return;
                }

                $item.removeClass(self.VIDEOLOADED);
                iframeElement.remove();
                cloneVideoDiv = $(this).clone();
                $(this).remove();
                $item.append(cloneVideoDiv);
            });

            self.playSlider();
        },

        /**
         *
         */
        loadVimeoJSFramework: function () {
            var element = document.createElement('script'),
                scriptTag = document.getElementsByTagName('script')[0];

            element.async = true;
            element.src = 'https://secure-a.vimeocdn.com/js/froogaloop2.min.js';
            scriptTag.parentNode.insertBefore(element, scriptTag);
        },

        /**
         * Creates gallery's API.
         *
         * Used by swatches/product_video
         */
        initApi: function () {
            var gallery = this,
                sliderElement = this.sliderElement,
                config = this.config,
                api = {

                    /**
                     * Displays the last image on preview.
                     */
                    last: function () {
                        var slick = gallery.sliderElement.slick('getSlick');
                        sliderElement.slick('slickGoTo', slick.$slides.length - 1);
                    },

                    /**
                     * Displays the first image on preview.
                     */
                    first: function () {
                        sliderElement.slick('slickGoTo', 0);
                    },

                    /**
                     * Displays previous element on preview.
                     */
                    prev: function () {
                        sliderElement.slick('slickPrev');
                    },

                    /**
                     * Displays next element on preview.
                     */
                    next: function () {
                        sliderElement.slick('slickNext');
                    },

                    /**
                     * Displays image with appropriate count number on preview.
                     */
                    seek: function (index) {
                        sliderElement.slick('slickGoTo', index);
                    },

                    /**
                     * Updates gallery with new set of options.
                     */
                    updateOptions: function (configuration, isInternal) {
                        // TODO Might be used only by defaukt gallery.js. Could be removed if that's the case.
                    },

                    /**
                     * Updates gallery with specific set of items.
                     */
                    updateData: function (data) {
                        if ($.isArray(data)) {
                            config.data = data;
                            gallery.reInitSlider();
                        }
                    },

                    /**
                     * Returns current images list
                     */
                    returnCurrentImages: function () {
                        var images = [];

                        $.each(config.data, function (key, item) {
                            images.push(item);
                        });

                        return images;
                    },

                    /**
                     * Updates gallery data partially by index
                     */
                    updateDataByIndex: function(index, item) {
                        config.data.splice(index, 1, item);
                        gallery.reInitSlider();
                    }
                };

            sliderElement.data('gallery', api);
            this.config.api = sliderElement.data('gallery');
            sliderElement.trigger('gallery:loaded');
        }
    });
});
