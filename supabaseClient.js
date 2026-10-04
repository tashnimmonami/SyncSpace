const SUPABASE_URL = "https://xcxgjpzlnzpycezduwru.supabase.co";
const SUPABASE_KEY = "sb_publishable_o92Wce4jifE_RCv0_Q18ig_ipTTA1YD";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadSupabaseData() {
    const { data: projects, error: projectError } =
        await supabaseClient.from("projects").select("*");

    if (projectError) {
        console.error("Projects loading failed:", projectError);
        return;
    }

    const { data: tasks, error: taskError } =
        await supabaseClient.from("tasks").select("*");

    if (taskError) {
        console.error("Tasks loading failed:", taskError);
        return;
    }

    console.log("Supabase projects:", projects);
    console.log("Supabase tasks:", tasks);
}

loadSupabaseData();