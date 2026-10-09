package com.taskly.task;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:taskly-test;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class TaskControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository tasks;

    @BeforeEach
    void clearTasks() {
        tasks.deleteAll();
    }

    @Test
    void createsListsAndDeletesTask() throws Exception {
        String task = """
                {
                  "title": "Preparar planejamento",
                  "assignee": "Ana Lima",
                  "priority": "MEDIUM",
                  "status": "NOT_STARTED",
                  "period": "WEEKLY",
                  "dueDateTime": "2026-10-12T14:30:00"
                }
                """;

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(task))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Preparar planejamento"));

        mockMvc.perform(get("/api/tasks").param("period", "WEEKLY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].assignee").value("Ana Lima"));

        Long id = tasks.findAll().getFirst().getId();
        mockMvc.perform(delete("/api/tasks/{id}", id))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}