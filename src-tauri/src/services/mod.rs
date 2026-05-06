use crate::models::{DailyOutcome, InterventionSuggestion, Task};

pub fn morning_briefing(date: &str, outcomes: &[DailyOutcome], tasks: &[Task]) -> (String, String, Vec<String>) {
    let headline = if outcomes.is_empty() {
        format!("Good morning. Define 1-3 outcomes for {}.", date)
    } else {
        format!("Focus on {} meaningful outcome(s) today.", outcomes.len())
    };

    let top_task = tasks.first().map(|task| task.title.clone()).unwrap_or_else(|| "your easiest next step".to_string());
    let focus_prompt = format!("Start with {top_task} and aim for visible progress before switching contexts.");
    let suggested_task_ids = tasks.iter().take(3).map(|task| task.id.clone()).collect();

    (headline, focus_prompt, suggested_task_ids)
}

pub fn stuck_suggestion(task: &Task, reason: &str) -> InterventionSuggestion {
    let next_step = match reason {
        "activation_friction" => "Open the task context, then complete a two-minute starter action before judging the rest.",
        "unclear_scope" => "Reduce the task to one concrete deliverable and stop after that first checkpoint.",
        _ => "Pick the smallest visible action and do only that for five minutes.",
    };

    InterventionSuggestion {
        task_id: task.id.clone(),
        reason: reason.to_string(),
        prompt: format!("You're not behind. Make '{}' smaller.", task.title),
        next_step: next_step.to_string(),
    }
}
