/**
 * Scandi_MagicZoom
 * @author Janis Kozulis <info@scandiweb.com>
 */
var config = {
    paths: {
        finger: 'Scandi_MagicZoom/lib/jquery.finger.min',
        slick: 'Scandi_MagicZoom/lib/slick/slick.min',
        elevatezoom: 'Scandi_MagicZoom/lib/elevatezoom/jquery.elevatezoom.min'
    },
    shim: {
        finger: ['jquery'],
        slick: ['jquery'],
        elevatezoom: ['jquery', 'finger']
    }
};
