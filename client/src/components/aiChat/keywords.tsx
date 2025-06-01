export const actionKeywords = ['goto', 'show', 'create', 'update', 'delete']
const entities = [
    { name: 'user', path: '/users' },
    { name: 'product', path: '/products' },
    { name: 'order', path: '/orders' },
    { name: 'invoice', path: '/invoices' },
    { name: 'payment', path: '/payments' }
];

export const entityKeywords = entities.map(entity => entity.name)
const keywords = [...actionKeywords, ...entityKeywords]

export default keywords
