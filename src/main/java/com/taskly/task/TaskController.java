package com.taskly.task;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
    private final TaskRepository tasks;

    public TaskController(TaskRepository tasks) {
        this.tasks = tasks;
    }

    @GetMapping
    public List<Task> list(
            @RequestParam(required = false) TaskPeriod period,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) String q
    ) {
        String query = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        return tasks.findAll().stream()
                .filter(task -> period == null || task.getPeriod() == period)
                .filter(task -> status == null || task.getStatus() == status)
                .filter(task -> query.isEmpty()
                        || task.getTitle().toLowerCase(Locale.ROOT).contains(query)
                        || (task.getAssignee() != null
                        && task.getAssignee().toLowerCase(Locale.ROOT).contains(query)))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(@Valid @RequestBody Task task) {
        task.setId(null);
        return tasks.save(task);
    }

    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @Valid @RequestBody Task request) {
        Task task = findTask(id);
        task.setTitle(request.getTitle());
        task.setAssignee(request.getAssignee());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setStatus(request.getStatus());
        task.setPeriod(request.getPeriod());
        task.setDueDateTime(request.getDueDateTime());
        return tasks.save(task);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        tasks.delete(findTask(id));
    }

    private Task findTask(Long id) {
        return tasks.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarefa não encontrada"));
    }
}