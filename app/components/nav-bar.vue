<script setup lang="ts">
const { loggedIn } = useUserSession();

const { t } = useI18n();
</script>

<template>
	<div class="navbar-wrapper">
		<nav class="container">
			<ul>
				<li><strong><NuxtLink to="/">shrimp</NuxtLink></strong></li>
				<li><NuxtLink to="/about">{{ t("navbar.about") }}</NuxtLink></li>
			</ul>
			<ul>
				<li><NuxtLink to="/image-editor">{{ t("navbar.editor") }}</NuxtLink></li>
			</ul>
			<ul v-if="loggedIn">
				<li><NuxtLink to="/account">{{ t("navbar.account") }}</NuxtLink></li>
			</ul>
			<ul v-else>
				<li><NuxtLink to="/login">{{ t("navbar.login") }}</NuxtLink></li>
				<li><NuxtLink to="/register">{{ t("navbar.register") }}</NuxtLink></li>
			</ul>
		</nav>
	</div>
	<br>
</template>

<style scoped>
.navbar-wrapper {
	background: #1c2538;
	border-bottom: 3px solid #000000;
}
</style>
