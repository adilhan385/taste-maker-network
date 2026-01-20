-- Add translation columns to products table for multilingual dish names and descriptions
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_ru TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS name_kz TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_ru TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_kz TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.products.name_ru IS 'Russian translation of dish name';
COMMENT ON COLUMN public.products.name_kz IS 'Kazakh translation of dish name';
COMMENT ON COLUMN public.products.description_ru IS 'Russian translation of dish description';
COMMENT ON COLUMN public.products.description_kz IS 'Kazakh translation of dish description';