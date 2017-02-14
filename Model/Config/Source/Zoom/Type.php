<?php
/**
 * Scandi_MagicZoom
 * @author Janis Kozulis <info@scandiweb.com>
 */
namespace Scandi\MagicZoom\Model\Config\Source\Zoom;

class Type implements \Magento\Framework\Option\ArrayInterface
{
    /**
     * @return array
     */
    public function toOptionArray()
    {
        return [['value' => 'window', 'label' => __('Window')], ['value' => 'inner', 'label' => __('Inner')]];
    }
}
