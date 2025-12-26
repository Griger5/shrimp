<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>

<template>
	<nav class="container">
		<ul>
			<li><strong><NuxtLink to="/">shrimp</NuxtLink></strong></li>
			<li><NuxtLink to="/about">About</NuxtLink></li>
		</ul>
		<ul v-if="loggedIn">
			<li><NuxtLink to="/image-editor">New Image</NuxtLink></li>
			<li><NuxtLink to="/account">Your account</NuxtLink></li>
		</ul>
		<ul v-else>
			<li><NuxtLink to="/image-editor">New Image</NuxtLink></li>
			<li><NuxtLink to="/login">Login</NuxtLink></li>
			<li><NuxtLink to="/register">Register</NuxtLink></li>
		</ul>
	</nav>
</template>
