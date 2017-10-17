# Scandiweb MagicZoom

Replaces Magento 2 native slider/zoom  with Slick slider, fancybox and ElevateZoom plugins.

## Installation

*Optional*, run only if "Core" module is not installed yet:
```
composer config repositories.module-core git https://github.com/scandiwebcom/Scandiweb-Assets-Core.git
composer require scandiweb/module-core:"~0.1.2"
```

```
composer config repositories.module-magiczoom git git@github.com:scandiwebcom/Magic-Zoom-for-Magento-2-by-Scandiweb.git
composer require scandiweb/module-magiczoom:1.1.4
php -f bin/magento setup:upgrade
```

## Configuration

Scandiweb -> MagicZoom -> Configuration
Add a comment to this line
or 
Stores -> Configuration -> SCANDIWEB -> MagicZoom
