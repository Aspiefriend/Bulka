const express = require('express');
const db = require('../db/db');

const router = express.Router();

const PRODUCT_SELECT = `
  SELECT
    p.id_product, p.name, p.description, p.price, p.icon,
    p.id_category,
    c.name AS category_name,
    c.icon AS category_icon
  FROM products p
  LEFT JOIN categories c ON p.id_category = c.id_category
`;

router.get('/', (req, res) => {
  try {
    const products = db
      .prepare(`${PRODUCT_SELECT} ORDER BY p.id_product`)
      .all();

    res.json({ data: products });
  } catch (err) {
    console.error('[products] GET /', err);
    res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
  }
});

router.get('/hits', (req,res)=>{
    try {
        const limit = Number(req.query.limit) || 4
        if(!Number.isInteger(limit)|| limit <= 0 || limit > 20) {
            return res.status(400).json({error: {message : 'Invalid limit', code:'VALIDATION'}})
            
        }
        const products = db.prepare(`
        SELECT
          p.id_product, p.name, p.description, p.price, p.icon, p.sales_count,
          p.id_category,
          c.name AS category_name,
          c.icon AS category_icon
        FROM products p
        LEFT JOIN categories c ON p.id_category = c.id_category
        ORDER BY p.sales_count DESC
        LIMIT ?
      `).all(limit)

      res.json({data: products})
    }
    catch (err) {
        console.error('[products] GET /hits',err)
        res.status(500).json({error : {message:'Internal server error' , code : 'INTERNAL'}})

    }


});


router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: { message: 'Invalid product id', code: 'VALIDATION' },
      });
    }

    const product = db
      .prepare(`${PRODUCT_SELECT} WHERE p.id_product = ?`)
      .get(id);

    if (!product) {
      return res.status(404).json({
        error: { message: 'Product not found', code: 'NOT_FOUND' },
      });
    }

    res.json({ data: product });
  } catch (err) {
    console.error('[products] GET /:id', err);
    res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL' },
    });
  }
});

module.exports = router;

