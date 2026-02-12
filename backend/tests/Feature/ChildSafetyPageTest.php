<?php

namespace Tests\Feature;

use Tests\TestCase;

class ChildSafetyPageTest extends TestCase
{
    public function test_child_safety_page_is_public_and_rendered(): void
    {
        $this->get('/child-safety')
            ->assertOk()
            ->assertSee('Child Safety Standards');
    }
}
