import mongoose from 'mongoose';
import config from 'config';
import Category from './category/category-model';
import Product from './product/product-model';
import Topping from './topping/topping-model';

const initDb = async () => {
  try {
    await mongoose.connect(config.get('database.url'));
    console.log('MongoDB connection successful');
  } catch (error) {
    console.log('MongoDB connection error', error);
    process.exit(1);
  }
};

const seed = async () => {
  try {
    await initDb();

    // Clear existing data
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Topping.deleteMany({});
    console.log('Cleared existing catalog data.');

    // Create Categories
    const categories = await Category.insertMany([
      {
        name: 'Pizza',
        priceConfiguration: {
          Small: { priceType: 'base', availableOptions: ['Thin', 'Thick'] },
          Medium: { priceType: 'base', availableOptions: ['Thin', 'Thick'] },
          Large: { priceType: 'base', availableOptions: ['Thin', 'Thick'] },
        },
        attributes: [
          {
            name: 'Crust',
            widgetType: 'radio',
            defaultValue: 'Thin',
            availableOptions: ['Thin', 'Thick'],
          },
        ],
      },
      {
        name: 'Beverages',
        priceConfiguration: {
          Default: { priceType: 'base', availableOptions: ['500ml', '1L'] },
        },
        attributes: [],
      },
    ]);
    console.log('Seeded Categories.');

    const pizzaCat = categories.find(c => c.name === 'Pizza');
    const beverageCat = categories.find(c => c.name === 'Beverages');

    // Create Toppings (around 10)
    const toppingData = Array.from({ length: 15 }).map((_, i) => ({
      name: `Topping ${i + 1}`,
      price: 10 + i * 5,
      image: `https://res.cloudinary.com/demo/image/upload/sample.jpg`,
      tenantId: '1',
    }));
    await Topping.insertMany([
      {
        name: 'Extra Cheese',
        price: 50,
        image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        tenantId: '1',
      },
      {
        name: 'Mushrooms',
        price: 30,
        image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        tenantId: '1',
      },
      ...toppingData,
    ]);
    console.log('Seeded Toppings.');

    // Create 100+ Products
    const productsToInsert = [];

    // Add robust manually defined ones first
    productsToInsert.push({
      name: 'Margherita Pizza',
      description: 'Classic tomato and mozzarella',
      image: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      priceConfiguration: {
        Small: { priceType: 'base', availableOptions: { Thin: 200, Thick: 220 } },
        Medium: { priceType: 'base', availableOptions: { Thin: 300, Thick: 330 } },
        Large: { priceType: 'base', availableOptions: { Thin: 400, Thick: 440 } },
      },
      tenantId: '1',
      categoryId: pizzaCat?._id,
      isPublish: true,
    });

    productsToInsert.push({
      name: 'Coca-Cola',
      description: 'Refreshing cold drink',
      image: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
      priceConfiguration: {
        Default: { priceType: 'base', availableOptions: { '500ml': 40, '1L': 70 } },
      },
      tenantId: '1',
      categoryId: beverageCat?._id,
      isPublish: true,
    });

    // Add 100 dynamically generated products for tenant "1"
    for (let i = 1; i <= 100; i++) {
      const isPizza = i % 2 === 0;
      productsToInsert.push({
        name: isPizza ? `Gourmet Pizza #${i}` : `Special Drink #${i}`,
        description: `This is a high quality ${isPizza ? 'pizza' : 'drink'} item for testing.`,
        image: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        priceConfiguration: isPizza
          ? {
              Small: { priceType: 'base', availableOptions: { Thin: 200 + i, Thick: 220 + i } },
              Medium: { priceType: 'base', availableOptions: { Thin: 300 + i, Thick: 330 + i } },
              Large: { priceType: 'base', availableOptions: { Thin: 400 + i, Thick: 440 + i } },
            }
          : {
              Default: { priceType: 'base', availableOptions: { '500ml': 40 + i, '1L': 70 + i } },
            },
        tenantId: '1',
        categoryId: isPizza ? pizzaCat?._id : beverageCat?._id,
        isPublish: true,
      });
    }

    await Product.insertMany(productsToInsert);
    console.log(`Seeded ${productsToInsert.length} Products.`);

    await mongoose.connection.close();
    console.log('Seed completed successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

seed();
