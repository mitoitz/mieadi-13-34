-- Habilitar RLS e criar políticas para as novas tabelas

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE congregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (admins podem tudo)
CREATE POLICY "Admins can manage congregations" ON congregations FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage fields" ON fields FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage courses" ON courses FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Teachers and admins can manage classes" ON classes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their enrollments" ON enrollments FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Admins can manage enrollments" ON enrollments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Students can view their attendances" ON attendances FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = attendances.enrollment_id AND enrollments.student_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Teachers can manage attendances" ON attendances FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their grades" ON grades FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM enrollments WHERE enrollments.id = grades.enrollment_id AND enrollments.student_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Teachers can manage grades" ON grades FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view their payments" ON payments FOR SELECT TO authenticated USING (
  student_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Admins can manage payments" ON payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador'))
);

CREATE POLICY "Students can view class materials" ON class_materials FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM enrollments e 
    JOIN classes c ON c.id = e.class_id 
    WHERE c.id = class_materials.class_id AND e.student_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Teachers can manage class materials" ON class_materials FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view assessments" ON assessments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM enrollments e 
    JOIN classes c ON c.id = e.class_id 
    WHERE c.id = assessments.class_id AND e.student_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Teachers can manage assessments" ON assessments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can view assessment questions" ON assessment_questions FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM assessments a
    JOIN classes c ON c.id = a.class_id
    JOIN enrollments e ON e.class_id = c.id
    WHERE a.id = assessment_questions.assessment_id AND e.student_id = auth.uid()
  ) OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Teachers can manage assessment questions" ON assessment_questions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

CREATE POLICY "Students can manage their own answers" ON student_answers FOR ALL TO authenticated USING (
  student_id = auth.uid() OR
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'coordenador', 'professor'))
);

-- Triggers para updated_at
CREATE OR REPLACE TRIGGER update_congregations_updated_at 
  BEFORE UPDATE ON congregations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_fields_updated_at 
  BEFORE UPDATE ON fields 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_courses_updated_at 
  BEFORE UPDATE ON courses 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_classes_updated_at 
  BEFORE UPDATE ON classes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_enrollments_updated_at 
  BEFORE UPDATE ON enrollments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_attendances_updated_at 
  BEFORE UPDATE ON attendances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_grades_updated_at 
  BEFORE UPDATE ON grades 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_payments_updated_at 
  BEFORE UPDATE ON payments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_class_materials_updated_at 
  BEFORE UPDATE ON class_materials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_assessments_updated_at 
  BEFORE UPDATE ON assessments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_assessment_questions_updated_at 
  BEFORE UPDATE ON assessment_questions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();