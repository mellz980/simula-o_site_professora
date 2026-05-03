-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert the required classes
INSERT INTO public.classes (name) VALUES 
('1A'), ('1B'), ('1C'), 
('2A'), ('2B'), ('2C');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
    class_id UUID REFERENCES public.classes(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create materials table
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK (type IN ('activity', 'lesson_plan', 'content')),
    content_url TEXT, -- Link or File URL
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for materials
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Policies for Materials
CREATE POLICY "Materials are viewable by assigned students" 
ON public.materials FOR SELECT USING (
    (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')) OR
    (class_id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid()))
);

CREATE POLICY "Only teachers can insert materials" 
ON public.materials FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

CREATE POLICY "Only teachers can update materials" 
ON public.materials FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

CREATE POLICY "Only teachers can delete materials" 
ON public.materials FOR DELETE USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Create allowed_students table (Whitelist)
CREATE TABLE public.allowed_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for allowed_students
ALTER TABLE public.allowed_students ENABLE ROW LEVEL SECURITY;

-- Policies for allowed_students
CREATE POLICY "Teachers can manage their allowed students" 
ON public.allowed_students FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

CREATE POLICY "Anyone can check if email is allowed" 
ON public.allowed_students FOR SELECT USING (true);
