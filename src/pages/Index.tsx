import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  Users, 
  Church, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  ArrowRight,
  Shield,
  BookOpen,
  Award,
  Upload,
  LogIn,
  Smartphone,
  UserCheck
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Gestão de Pessoas",
      description: "Controle completo de alunos, professores e obreiros",
      color: "bg-gradient-primary"
    },
    {
      icon: Church,
      title: "Congregações & Campos",
      description: "Organize territórios e comunidades eclesiásticas",
      color: "bg-gradient-secondary"
    },
    {
      icon: GraduationCap,
      title: "Cursos & Disciplinas",
      description: "Sistema educacional completo e estruturado",
      color: "bg-gradient-accent"
    },
    {
      icon: Calendar,
      title: "Controle de Frequência",
      description: "Registro presencial com tecnologia biométrica",
      color: "bg-gradient-primary"
    },
    {
      icon: DollarSign,
      title: "Gestão Financeira",
      description: "Controle de mensalidades e taxas educacionais",
      color: "bg-gradient-secondary"
    },
    {
      icon: BarChart3,
      title: "Relatórios Inteligentes",
      description: "Análises detalhadas e dashboards executivos",
      color: "bg-gradient-accent"
    }
  ];

  const stats = [
    { label: "Congregações", value: "50+", icon: Church },
    { label: "Alunos Ativos", value: "1.200+", icon: Users },
    { label: "Professores", value: "80+", icon: GraduationCap },
    { label: "Cursos Oferecidos", value: "25+", icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/lovable-uploads/3781b316-2d9c-4e52-9847-bbf43a15c4fe.png" 
              alt="MIEADI Logo" 
              className="h-20 w-auto mx-auto mb-6 drop-shadow-lg animate-float"
            />
            <Badge variant="secondary" className="mb-4 text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />
              Sistema Oficial MIEADI
            </Badge>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Sistema de Gestão
            <span className="block text-accent">Eclesiástico</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Plataforma completa para gerenciamento educacional do Ministério de Integração 
            Eclesiástico Assembleia de Deus Independente
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent text-white font-semibold px-8 py-4 text-lg hover:scale-105 transition-all duration-300 shadow-elegant"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Fazer Login
              </Button>
            </Link>
            
            <Link to="/login">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white/20 font-semibold px-8 py-4 text-lg transition-all duration-300"
              >
                <Smartphone className="mr-2 h-5 w-5" />
                Portal Pessoal
              </Button>
            </Link>
            
            <Link to="/cadastro">
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto bg-white/10 text-white hover:bg-white/20 font-semibold px-8 py-4 text-lg transition-all duration-300"
              >
                <UserCheck className="mr-2 h-5 w-5" />
                Cadastrar-se
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-elegant hover:shadow-primary transition-all duration-300 hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-lg mb-4">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-16 px-4 bg-gradient-subtle">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Acesso Rápido
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Ferramentas essenciais para diretores
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="default" 
              size="lg" 
              className="group"
              onClick={() => {
                console.log('Redirecionando para frequência...');
                window.location.href = '/frequencia';
              }}
            >
              <Upload className="mr-2 h-5 w-5" />
              Acessar Gerenciamento de Frequências
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Award className="w-4 h-4 mr-2" />
              Funcionalidades
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Sistema completo de gestão educacional desenvolvido especificamente 
              para as necessidades do ministério
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-primary transition-all duration-300 hover:-translate-y-2 border-0 shadow-elegant">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} rounded-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Acesse o sistema e experimente todas as funcionalidades desenvolvidas 
            para otimizar a gestão do seu ministério
          </p>
          <Link to="/auth">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90"
            >
              Fazer Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="/lovable-uploads/3781b316-2d9c-4e52-9847-bbf43a15c4fe.png" 
              alt="MIEADI Logo" 
              className="h-8 w-auto"
            />
            <span className="text-lg font-semibold">MIEADI</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Ministério de Integração Eclesiástico Assembleia de Deus Independente
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Todos os direitos reservados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
