import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { Product } from './app/product/product';

bootstrapApplication(Product)
  .catch((err) => console.error(err));
