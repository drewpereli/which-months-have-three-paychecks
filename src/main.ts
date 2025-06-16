import "./style.css";

import Alpine from 'alpinejs'
import mask from '@alpinejs/mask'

Alpine.plugin(mask);

(window as unknown as {Alpine: typeof Alpine}).Alpine = Alpine
 
Alpine.start();