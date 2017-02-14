<?php
/**
 * Scandi_MagicZoom
 * @author Janis Kozulis <info@scandiweb.com>
 */
namespace Scandi\MagicZoom\Block;

use Magento\Framework\Json\EncoderInterface;
use Scandi\MagicZoom\Helper\Config;

class Gallery extends \Magento\Catalog\Block\Product\View\Gallery
{
    /**
     * @var Config
     */
    protected $_config;

    /**
     * Gallery constructor.
     *
     * @param \Magento\Catalog\Block\Product\Context $context
     * @param \Magento\Framework\Stdlib\ArrayUtils   $arrayUtils
     * @param Config                                 $config
     * @param EncoderInterface                       $jsonEncoder
     * @param array                                  $data
     */
    public function __construct(
        \Magento\Catalog\Block\Product\Context $context,
        \Magento\Framework\Stdlib\ArrayUtils $arrayUtils,
        Config $config,
        EncoderInterface $jsonEncoder,
        array $data
    ) {
        $this->_config = $config;
        parent::__construct($context, $arrayUtils, $jsonEncoder, $data);
    }

    /**
     * Retrieve product images in JSON format
     *
     * @return string
     */
    public function getGalleryImagesJson()
    {
        $imagesItems = [];
        foreach ($this->getGalleryImages() as $image) {
            $imagesItems[] = [
                'thumb' => $image->getData('small_image_url'),
                'img' => $image->getData('medium_image_url'),
                'full' => $image->getData('large_image_url'),
                'caption' => $image->getLabel(),
                'position' => $image->getPosition(),
                'isMain' => $this->isMainImage($image),
                'mediaType' => $image->getMediaType(),
                'videoUrl' => $image->getVideoUrl()
            ];
        }
        if (empty($imagesItems)) {
            $imagesItems[] = [
                'thumb' => $this->_imageHelper->getDefaultPlaceholderUrl('thumbnail'),
                'img' => $this->_imageHelper->getDefaultPlaceholderUrl('image'),
                'full' => $this->_imageHelper->getDefaultPlaceholderUrl('image'),
                'caption' => '',
                'position' => '0',
                'isMain' => true,
                'mediaType' => 'image',
                'videoUrl' => ''
            ];
        }
        return json_encode($imagesItems);
    }

    /**
     * @param      $path
     * @param bool $asBoolString
     *
     * @return mixed|string
     */
    public function getConfigVal($path, $asBoolString = false)
    {
        $value = $this->_config->getConfigVal($path);
        if ($asBoolString) {
            return ($value) ? 'true' : 'false';
        }
        return $value;
    }
}
