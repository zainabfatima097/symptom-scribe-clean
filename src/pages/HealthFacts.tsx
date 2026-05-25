import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, BookOpen, Heart, Brain, Dna, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showInfo, showError } from "@/lib/toast-helpers";

interface HealthFact {
  category: string;
  title: string;
  fact: string;
  fullUrl: string;
  thumbnail?: string;
}

// Curated list of real Wikipedia health topics — each maps to a valid article
const HEALTH_TOPICS: { topic: string; category: string }[] = [
  { topic: "Cardiovascular_disease", category: "Cardiovascular" },
  { topic: "Human_brain", category: "Neuroscience" },
  { topic: "Immune_system", category: "Immunology" },
  { topic: "DNA", category: "Genetics" },
  { topic: "Sleep", category: "Sleep Science" },
  { topic: "Gut_microbiota", category: "Microbiome" },
  { topic: "Metabolism", category: "Metabolism" },
  { topic: "Insulin", category: "Endocrinology" },
  { topic: "Lung", category: "Respiratory" },
  { topic: "Neuron", category: "Neuroscience" },
  { topic: "Vitamin_D", category: "Nutrition" },
  { topic: "Cortisol", category: "Hormones" },
  { topic: "Stem_cell", category: "Cell Biology" },
  { topic: "Alzheimer%27s_disease", category: "Neurodegeneration" },
  { topic: "Cancer", category: "Oncology" },
  { topic: "Mitochondrion", category: "Cell Biology" },
  { topic: "Dopamine", category: "Neuroscience" },
  { topic: "Telomere", category: "Ageing Biology" },
  { topic: "Protein", category: "Biochemistry" },
  { topic: "Lymph_node", category: "Immunology" },
  { topic: "Serotonin", category: "Mental Health" },
  { topic: "Cholesterol", category: "Cardiovascular" },
  { topic: "Vaccination", category: "Immunology" },
  { topic: "Antibiotic", category: "Pharmacology" },
  { topic: "Type_2_diabetes", category: "Endocrinology" },
  { topic: "Hypertension", category: "Cardiovascular" },
  { topic: "Bone_marrow", category: "Haematology" },
  { topic: "Retina", category: "Vision" },
  { topic: "Kidney", category: "Nephrology" },
  { topic: "Liver", category: "Hepatology" },
  { topic: "CRISPR", category: "Genetic Research" },
  { topic: "Melatonin", category: "Sleep Science" },
  { topic: "Endorphins", category: "Mental Health" },
  { topic: "Placebo", category: "Medical Research" },
  { topic: "Microplastics", category: "Environmental Health" },
];

const getCategoryStyle = (category: string): string => {
  const c = category.toLowerCase();
  if (c.includes("cardio") || c.includes("heart")) return "from-red-500 to-pink-500";
  if (c.includes("brain") || c.includes("neuro") || c.includes("sleep") || c.includes("mental") || c.includes("dopamine") || c.includes("serotonin")) return "from-purple-500 to-indigo-500";
  if (c.includes("gene") || c.includes("dna") || c.includes("cancer") || c.includes("microbiome") || c.includes("cell") || c.includes("crispr")) return "from-blue-500 to-cyan-500";
  if (c.includes("nutrition") || c.includes("diet") || c.includes("gut") || c.includes("metabol") || c.includes("protein") || c.includes("biochem")) return "from-green-500 to-emerald-500";
  if (c.includes("bone") || c.includes("muscle") || c.includes("haem") || c.includes("blood")) return "from-orange-500 to-yellow-500";
  if (c.includes("immune") || c.includes("skin") || c.includes("hormon") || c.includes("endocrin")) return "from-teal-500 to-green-500";
  if (c.includes("research") || c.includes("pharma") || c.includes("placebo")) return "from-blue-500 to-indigo-500";
  if (c.includes("vision") || c.includes("eye")) return "from-amber-500 to-orange-500";
  if (c.includes("respirat") || c.includes("lung")) return "from-cyan-500 to-blue-500";
  if (c.includes("ageing") || c.includes("environment")) return "from-fuchsia-500 to-purple-500";
  return "from-primary to-primary-glow";
};

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes("brain") || c.includes("neuro") || c.includes("mental") || c.includes("dopamine") || c.includes("serotonin")) return Brain;
  if (c.includes("gene") || c.includes("dna") || c.includes("cell") || c.includes("crispr")) return Dna;
  if (c.includes("research") || c.includes("vision") || c.includes("pharma") || c.includes("placebo")) return BookOpen;
  if (c.includes("ageing") || c.includes("environment")) return Sparkles;
  return Heart;
};

// Tracks shown topic indices this session so no topic repeats until all are exhausted
const shownIndices = new Set<number>();

const HealthFacts = () => {
  const [currentFact, setCurrentFact] = useState<HealthFact | null>(null);
  const [factHistory, setFactHistory] = useState<HealthFact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFact = async (isInitial = false) => {
    setLoading(true);
    setError(null);

    // Reset pool when all topics have been shown
    if (shownIndices.size >= HEALTH_TOPICS.length) {
      shownIndices.clear();
      if (!isInitial) showInfo("All topics covered!", "Starting a fresh cycle.");
    }

    // Pick from topics not yet shown this cycle
    const remaining = HEALTH_TOPICS
      .map((_, i) => i)
      .filter((i) => !shownIndices.has(i));
    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    shownIndices.add(pick);

    const { topic, category } = HEALTH_TOPICS[pick];

    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${topic}`,
        { headers: { "Accept": "application/json" } }
      );

      if (!res.ok) throw new Error(`Wikipedia returned ${res.status}`);

      const data = await res.json();

      // Wikipedia summaries can be long — take the first 2 sentences max
      const sentences = data.extract?.match(/[^.!?]+[.!?]+/g) ?? [];
      const fact = sentences.slice(0, 2).join(" ").trim() || data.extract;

      if (!fact) throw new Error("Empty extract from Wikipedia");

      const factObj: HealthFact = {
        category,
        title: data.title,
        fact,
        fullUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${topic}`,
        thumbnail: data.thumbnail?.source,
      };

      setCurrentFact(factObj);
      setFactHistory((prev) => {
        if (prev[0]?.fact === factObj.fact) return prev;
        return [factObj, ...prev].slice(0, 10);
      });

      if (!isInitial) showSuccess("New Health Fact!", `Topic: ${data.title}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load fact";
      setError(message);
      showError("Couldn't load fact", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFact(true);
    showInfo("Welcome to Health Facts!", "Powered by Wikipedia — real medical knowledge");
  }, []);

  const gradient = currentFact ? getCategoryStyle(currentFact.category) : "from-primary to-primary-glow";
  const Icon = currentFact ? getCategoryIcon(currentFact.category) : Heart;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" />
          Did You Know? Health Facts
        </h1>
        <p className="text-muted-foreground mt-2">
          Real medical knowledge from Wikipedia — a different topic every time, no repeats
        </p>
      </div>

      {/* Current Fact */}
      <Card className="border-2 bg-gradient-to-br from-background to-accent/20">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              {currentFact && (
                <Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>
                  {currentFact.category}
                </Badge>
              )}
              <CardTitle className="text-2xl">
                {loading ? "Loading..." : currentFact?.title ?? "Health Fact"}
              </CardTitle>
              {currentFact && (
                <a
                  href={currentFact.fullUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Read full article on Wikipedia
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Thumbnail if available, else icon */}
            {currentFact?.thumbnail && !loading ? (
              <img
                src={currentFact.thumbnail}
                alt={currentFact.title}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                {loading
                  ? <Loader2 className="w-8 h-8 text-white animate-spin" />
                  : <Icon className="w-8 h-8 text-white" />
                }
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Failed to load fact</p>
                <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          ) : currentFact ? (
            <p className="text-lg leading-relaxed text-foreground">{currentFact.fact}</p>
          ) : null}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Source: Wikipedia (CC BY-SA)</span>
            <span>{HEALTH_TOPICS.length - shownIndices.size} topics remaining this cycle</span>
          </div>

          <Button onClick={() => fetchFact(false)} disabled={loading} className="w-full gap-2">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Loading fact...</>
              : <><RefreshCw className="w-4 h-4" />Show Me Another Fact</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Category highlight cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-500" />
              Body Facts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Anatomy, physiology, and how your body works</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Brain & Mind
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Neuroscience, mental health, and cognition</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              Latest Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Cutting-edge discoveries and breakthroughs</p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recently Viewed Facts
          </CardTitle>
          <CardDescription>Your fact exploration history</CardDescription>
        </CardHeader>
        <CardContent>
          {factHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No facts viewed yet. Click "Show Me Another Fact" to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {factHistory.map((fact, index) => {
                const FactIcon = getCategoryIcon(fact.category);
                const factGradient = getCategoryStyle(fact.category);
                return (
                  <div
                    key={`${fact.title}-${index}`}
                    className="p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${factGradient} flex items-center justify-center flex-shrink-0`}>
                        <FactIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline">{fact.category}</Badge>
                          <a
                            href={fact.fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {fact.title} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-sm text-foreground">{fact.fact}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthFacts;
