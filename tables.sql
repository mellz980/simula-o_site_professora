-- Create classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
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

-- Enable RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Policies for Classes
CREATE POLICY "Teachers can manage their own classes" 
ON public.classes FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Students can see their own class" 
ON public.classes FOR SELECT USING (
    id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid())
);

-- Policies for Materials
CREATE POLICY "Teachers can manage their own materials" 
ON public.materials FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Students can view materials for their class" 
ON public.materials FOR SELECT USING (
    class_id IN (SELECT class_id FROM public.profiles WHERE id = auth.uid())
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
