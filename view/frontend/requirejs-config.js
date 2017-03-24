/**
 * Scandi_MagicZoom
 * @author Janis Kozulis <info@scandiweb.com>
 */
var config = {
    paths: {
        finger: 'Scandi_MagicZoom/lib/jquery.finger.min',
        slick: 'Scandi_MagicZoom/lib/slick/slick.min',
        elevatezoom: 'Scandi_MagicZoom/lib/elevatezoom/jquery.elevatezoom.min',
        fancybox: 'Scandi_MagicZoom/lib/fancybox/jquery.fancybox.min'
    },
    shim: {
        finger: ['jquery'],
        fancybox: ['jquery'],
        slick: ['jquery'],
        elevatezoom: ['jquery', 'finger']
    }
};
