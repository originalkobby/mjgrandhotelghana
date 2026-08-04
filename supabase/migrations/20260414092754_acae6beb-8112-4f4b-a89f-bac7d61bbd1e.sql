-- Update sort_order to ensure Standard comes before Deluxe
UPDATE rooms SET sort_order = 0 WHERE name = 'Single';
UPDATE rooms SET sort_order = 1 WHERE name = 'Standard';
UPDATE rooms SET sort_order = 2 WHERE name = 'Deluxe';
UPDATE rooms SET sort_order = 3 WHERE name = 'Twin Bed';
UPDATE rooms SET sort_order = 4 WHERE name = 'Junior Suite';
UPDATE rooms SET sort_order = 5 WHERE name = 'Executive';