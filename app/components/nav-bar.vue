<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>

<template>
	<div class="navbar-wrapper">
		<nav class="container">
			<ul>
				<li><strong><NuxtLink to="/">shrimp</NuxtLink></strong></li>
				<li><NuxtLink to="/about">About</NuxtLink></li>
			</ul>
			<ul>
				<li><NuxtLink to="/image-editor">Editor</NuxtLink></li>
			</ul>
			<ul v-if="loggedIn">
				<li><NuxtLink to="/account">Your account</NuxtLink></li>
			</ul>
			<ul v-else>
				<li><NuxtLink to="/login">Login</NuxtLink></li>
				<li><NuxtLink to="/register">Register</NuxtLink></li>
			</ul>
		</nav>
	</div>
	<br/>
</template>

<style scoped>
.navbar-wrapper {
	background: #1c2538;
	border-bottom: 3px solid #000000;
}
</style>