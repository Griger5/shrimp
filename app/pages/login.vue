<script setup lang="ts">
definePageMeta({
	middleware: ["logged-in"],
});

const { t } = useI18n();

const { fetch: refreshSession } = useUserSession();
const credentials = reactive({
	email: "",
	password: "",
});

async function login() {
	const { data, error } = await useFetch("/api/login", {
		method: "POST",
		body: credentials,
	});

	if (error.value?.statusCode) {
		if ([400, 401].includes(error.value.statusCode)) {
			alert(error.value.statusMessage);
		}
		else {
			alert("Couldn't log in. Please try again later.");
		}

		return;
	}

	await refreshSession();
	await navigateTo("/");
}
</script>

<template>
	<h1>{{ t("login.title") }}</h1>
	<form @submit.prevent="login">
		<input
			v-model="credentials.email"
			type="email"
			:placeholder="t('login.email')"
			required
		>
		<input
			v-model="credentials.password"
			type="password"
			:placeholder="t('login.password')"
			required
		>
		<button type="submit">
			{{ t("login.title") }}
		</button>
	</form>

	<NuxtLink to="/register">{{ t("login.no_account") }}</NuxtLink>
</template>
