<?php
/**
 * Scandi_MagicZoom
 * @author Janis Kozulis <info@scandiweb.com>
 */
namespace Scandi\MagicZoom\Helper;

use \Magento\Framework\App\Config\ScopeConfigInterface;
use \Magento\Store\Model\ScopeInterface;

class Config
{
    /**
     * Config constructor.
     *
     * @param ScopeConfigInterface $scopeConfig
     */
    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->_scopeConfig = $scopeConfig;
    }

    /**
     * @param $path
     *
     * @return mixed
     */
    public function getConfigVal($path)
    {
        return $this->_scopeConfig->getValue($path, ScopeInterface::SCOPE_STORE);
    }
}
