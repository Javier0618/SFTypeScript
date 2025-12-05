-- ============================================
-- Script SQL para agregar control de visibilidad por pantalla
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Paso 1: Agregar columna screen_visibility a la tabla sections (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sections' 
        AND column_name = 'screen_visibility'
    ) THEN
        ALTER TABLE sections 
        ADD COLUMN screen_visibility TEXT DEFAULT 'all';
        
        RAISE NOTICE 'Columna screen_visibility agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna screen_visibility ya existe';
    END IF;
END $$;

-- Paso 2: Agregar comentario descriptivo a la columna
COMMENT ON COLUMN sections.screen_visibility IS 
'Control de visibilidad por tamaño de pantalla:
- all: Visible en todos los dispositivos (valor por defecto)
- mobile: Solo visible en móvil y tablet (max-width: 768px)
- desktop: Solo visible en desktop (min-width: 769px)';

-- Paso 3: Crear índice para optimizar consultas filtradas por screen_visibility
CREATE INDEX IF NOT EXISTS idx_sections_screen_visibility 
ON sections(screen_visibility);

-- Paso 4: Actualizar secciones existentes que tengan NULL a 'all'
UPDATE sections 
SET screen_visibility = 'all' 
WHERE screen_visibility IS NULL;

-- Paso 5: Verificar la estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sections'
ORDER BY ordinal_position;

-- ============================================
-- NOTA: Los valores permitidos para screen_visibility son:
-- 
-- 'all'     -> Visible en todos los dispositivos (por defecto)
-- 'mobile'  -> Solo móvil y tablet (≤768px) - Se oculta en desktop
-- 'desktop' -> Solo desktop (≥769px) - Se oculta en móvil y tablet
-- ============================================
