-- Create chef_availability table for schedule management
CREATE TABLE public.chef_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chef_id UUID NOT NULL,
  is_kitchen_open BOOLEAN NOT NULL DEFAULT true,
  working_days TEXT[] NOT NULL DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}'::text[],
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '21:00:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (chef_id)
);

-- Enable RLS
ALTER TABLE public.chef_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for chef_availability
CREATE POLICY "Chefs can manage own availability"
ON public.chef_availability
FOR ALL
USING (auth.uid() = chef_id AND has_role(auth.uid(), 'cook'::app_role));

CREATE POLICY "Anyone can view chef availability"
ON public.chef_availability
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_chef_availability_updated_at
BEFORE UPDATE ON public.chef_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add allergens column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}'::text[];

-- Add portion_size column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS portion_size TEXT;

-- Add ingredients column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}'::text[];

-- Add available_days column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS available_days TEXT[] DEFAULT '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday}'::text[];

-- Add available_hours column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS available_start_time TIME DEFAULT '09:00:00';

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS available_end_time TIME DEFAULT '21:00:00';

-- Create product_images storage bucket for dish photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Chefs can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'cook'::app_role));

CREATE POLICY "Chefs can update own product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'cook'::app_role));

CREATE POLICY "Chefs can delete own product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'cook'::app_role));